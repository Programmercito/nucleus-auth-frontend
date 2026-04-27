import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private readonly http = inject(HttpClient);
  private csrfInitialized = false;

  private getXsrfTokenFromCookie(): string | null {
    const match = document.cookie.match(/(^|;)\s*XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[2]) : null;
  }

  private attachXsrfHeader(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.getXsrfTokenFromCookie();
    return token ? request.clone({ headers: request.headers.set('X-XSRF-TOKEN', token) }) : request;
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const csrfUrl = `/api/sanctum/csrf-cookie`;
    const isCsrfRequest = req.url === csrfUrl;
    const isApiRequest = req.url.startsWith('/api') || isCsrfRequest;

    if (!isApiRequest) {
      return next.handle(req);
    }

    const requestWithCredentials = req.clone({ withCredentials: true });

    if (isCsrfRequest) {
      return next.handle(requestWithCredentials);
    }

    if (this.csrfInitialized) {
      return next.handle(this.attachXsrfHeader(requestWithCredentials));
    }

    return this.http.get(csrfUrl, { withCredentials: true }).pipe(
      tap(() => this.csrfInitialized = true),
      switchMap(() => {
        const freshRequest = req.clone({ withCredentials: true });
        return next.handle(this.attachXsrfHeader(freshRequest));
      })
    );
  }
}

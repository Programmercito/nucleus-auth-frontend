import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private csrfInitialized = false;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const csrfUrl = `${this.apiUrl}/sanctum/csrf-cookie`;
    const isCsrfRequest = req.url === csrfUrl;
    const isApiRequest = req.url.startsWith(this.apiUrl);

    if (!isApiRequest) {
      return next.handle(req);
    }

    const requestWithCredentials = req.clone({ withCredentials: true });

    if (isCsrfRequest) {
      return next.handle(requestWithCredentials);
    }

    if (this.csrfInitialized) {
      return next.handle(requestWithCredentials);
    }

    return this.http.get(csrfUrl, { withCredentials: true }).pipe(
      tap(() => this.csrfInitialized = true),
      switchMap(() => next.handle(requestWithCredentials))
    );
  }
}

import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private readonly http = inject(HttpClient);

  private readonly csrfUrl = `/api/sanctum/csrf-cookie`;

  private decodeCookieToken(value: string): string {
    let decoded = value;
    for (let i = 0; i < 2; i++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      } catch {
        break;
      }
    }
    return decoded;
  }

  private getXsrfTokenFromCookie(): string | null {
    const match = document.cookie.match(/(^|;)\s*XSRF-TOKEN=([^;]*)/);
    return match ? this.decodeCookieToken(match[2]) : null;
  }

  private attachXsrfHeader(request: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.getXsrfTokenFromCookie();
    return token ? request.clone({ headers: request.headers.set('X-XSRF-TOKEN', token) }) : request;
  }

  private refreshCsrfCookie(): Observable<unknown> {
    return this.http.get(this.csrfUrl, { withCredentials: true });
  }
 
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isCsrfRequest = req.url === this.csrfUrl;
    const isApiRequest = req.url.startsWith('/api') || isCsrfRequest;
    const requiresCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

    if (!isApiRequest || isCsrfRequest) {
      return next.handle(req.clone({ withCredentials: true }));
    }

    if (!requiresCsrf) {
      return next.handle(req.clone({ withCredentials: true }));
    }

    return new Observable<HttpEvent<unknown>>((observer) => {
      const subscriptions = new Subscription();

      const csrfSub = this.refreshCsrfCookie().subscribe({
        next: () => {
          const request = this.attachXsrfHeader(req.clone({ withCredentials: true }));
          const reqSub = next.handle(request).subscribe({
            next: (event) => observer.next(event),
            complete: () => observer.complete(),
            error: (error) => observer.error(error),
          });
          subscriptions.add(reqSub);
        },
        error: (error) => observer.error(error),
      });

      subscriptions.add(csrfSub);
      return () => subscriptions.unsubscribe();
    });
  }
}

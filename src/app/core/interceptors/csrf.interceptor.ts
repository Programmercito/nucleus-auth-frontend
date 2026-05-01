import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, Subscriber, Subscription } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private readonly http = inject(HttpClient);
  private csrfInitialized = false;

  private readonly csrfUrl = `/api/sanctum/csrf-cookie`;

  private decodeCookieToken(value: string): string {
    let decoded = value;

    // Some environments can double-encode cookie values (%253D). Decode safely up to 2 times.
    for (let i = 0; i < 2; i++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) {
          break;
        }

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

  private sendWithCsrf(
    req: HttpRequest<unknown>,
    next: HttpHandler,
    observer: Subscriber<HttpEvent<unknown>>,
    subscriptions: Subscription,
    retried: boolean,
  ): void {
    const request = this.attachXsrfHeader(req.clone({ withCredentials: true }));

    const requestSub = next.handle(request).subscribe({
      next: (event) => observer.next(event),
      complete: () => observer.complete(),
      error: (error: { status?: number }) => {
        // If CSRF/session got out of sync, refresh cookie and retry once.
        if (error?.status !== 419 || retried) {
          observer.error(error);
          return;
        }

        this.csrfInitialized = false;

        const refreshSub = this.refreshCsrfCookie().subscribe({
          next: () => {
            this.csrfInitialized = true;
            this.sendWithCsrf(req, next, observer, subscriptions, true);
          },
          error: () => observer.error(error),
        });

        subscriptions.add(refreshSub);
      },
    });

    subscriptions.add(requestSub);
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isCsrfRequest = req.url === this.csrfUrl;
    const isApiRequest = req.url.startsWith('/api') || isCsrfRequest;

    if (!isApiRequest) {
      return next.handle(req);
    }

    const requestWithCredentials = req.clone({ withCredentials: true });

    if (isCsrfRequest) {
      return next.handle(requestWithCredentials);
    }

    return new Observable<HttpEvent<unknown>>((observer) => {
      const subscriptions = new Subscription();

      if (this.csrfInitialized) {
        this.sendWithCsrf(requestWithCredentials, next, observer, subscriptions, false);
        return () => subscriptions.unsubscribe();
      }

      const csrfSub = this.refreshCsrfCookie().subscribe({
        next: () => {
          this.csrfInitialized = true;
          this.sendWithCsrf(requestWithCredentials, next, observer, subscriptions, false);
        },
        error: (error) => observer.error(error),
      });

      subscriptions.add(csrfSub);

      return () => subscriptions.unsubscribe();
    });
  }
}

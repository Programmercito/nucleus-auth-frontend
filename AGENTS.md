# AGENTS.md - Nucleus Auth Frontend

This document defines mandatory rules for AI agents working on the Nucleus Auth Frontend (Angular).

## Project Overview

Angular 21 frontend for authentication and SSO flows against the auth backend.

## Mandatory HTTP Consumption Rule

For this repository, HTTP service consumption must follow this standard:

```typescript
// Service: return the observable directly — no pipe, no subscribe, no new Observable()
login(credentials: any): Observable<any> {
  return this.http.post(`/api/login`, credentials, { withCredentials: true });
}

// Component: call .subscribe({ next, error }) and own all side effects
this.authService.login(payload).subscribe({
  next: (res) => { /* navigate, update state */ },
  error: (err) => { /* show error */ },
});
```

- Services return the raw `Observable` from `HttpClient` — no `pipe`, no `subscribe`, no `new Observable(...)`.
- Components call `.subscribe({ next, error })` and own all side effects (navigation, loading state, error messages).
- NEVER use `pipe(tap(...))` to handle side effects in services.

## Request Conventions

- For backend API calls, use `withCredentials: true`.
- For CSRF-protected flows, ensure CSRF cookie is initialized before protected POST requests.

## Coding Style

- TypeScript strict typing.
- Keep methods small and readable.
- Add short comments only when logic is non-obvious.
- Preserve existing project structure and naming conventions.

## Validation Before Finishing Changes

- Confirm TypeScript has no new errors in edited files.
- Avoid unrelated refactors.
- Keep changes focused on the requested behavior.

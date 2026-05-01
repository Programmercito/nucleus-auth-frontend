# AGENTS.md - Nucleus Auth Frontend

This document defines mandatory rules for AI agents working on the Nucleus Auth Frontend (Angular).

## Project Overview

Angular 21 frontend for authentication and SSO flows against the auth backend.

## Mandatory HTTP Consumption Rule

For this repository, HTTP service consumption must follow this standard:

- Use `subscribe({ next, error, complete })` for consuming HTTP calls.
- Prefer explicit `next` and `error` handlers in services/components/interceptors.
- Do not use `pipe(...)` to orchestrate HTTP request flow unless the user explicitly asks for it.
- Keep request side effects explicit (`loading`, `error`, state updates) inside `next` and `error` handlers.

## Request Conventions

- For backend API calls, use `withCredentials: true`.
- For CSRF-protected flows, ensure CSRF cookie is initialized before protected POST requests.
- Keep auth and error handling consistent with service-level state (`signals` in this project).

## Coding Style

- TypeScript strict typing.
- Keep methods small and readable.
- Add short comments only when logic is non-obvious.
- Preserve existing project structure and naming conventions.

## Validation Before Finishing Changes

- Confirm TypeScript has no new errors in edited files.
- Avoid unrelated refactors.
- Keep changes focused on the requested behavior.

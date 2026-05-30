# ADR-008: Server-to-server Fineract (BFF)

## Status

Accepted

## Context

Calling Fineract from the browser exposes backend URLs, tenant identifiers, and authentication material. Financial apps should treat the Next.js server as the only Fineract client.

## Decision

1. **No browser → Fineract HTTP.** All Fineract calls use `createFineractClient()` on the server.
2. **Browser → `/api/*` or Server Actions** only.
3. **Fineract configuration** uses server env vars (`FINERACT_API_URL`, `FINERACT_TENANT_ID`) — no `NEXT_PUBLIC_FINERACT_*`.
4. **Session secrets** (`accessToken`, `base64EncodedAuthenticationKey`) are stored in httpOnly cookies and excluded from `SessionProvider` via `getPublicSession()`.
5. `@mifos/api-client` is consumed only through server-only wrappers in `apps/web`.

## Consequences

- TanStack Query targets same-origin BFF routes.
- Route Handlers must duplicate RBAC checks (`assertCan`) even when UI hides actions.
- Local dev points `FINERACT_API_URL` at Fineract (or a server-side proxy), not the Angular-style browser proxy.

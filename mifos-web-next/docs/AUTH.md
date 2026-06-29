# Authentication

Fineract **basic authentication** via the app BFF. The browser never calls `POST /authentication` directly.

## Flow

```text
1. /login       — pick Fineract server (sheet) + username + password form
3. Server Action — POST {baseUrl}/authentication (tenant header); returns `{ ok: true, redirectTo }` for client navigation
4. httpOnly cookie mifos-session — user + permissions + base64EncodedAuthenticationKey
5. BFF routes   — Authorization: Basic {key} on server-side fetch
```

## Session cookie

| Property | Value |
|----------|--------|
| Name | `mifos-session` |
| Content | JSON `ServerSession` (secrets stay httpOnly) |
| Default TTL | 8 hours |
| Remember me | 14 days |
| Idle sign-out | From server global config via login (`sessionIdleTimeoutMinutes`, `sessionIdleWarningSeconds`); env vars are fallback |

Public fields exposed to React via `getPublicSession()` / `SessionProvider` (no auth key).

## Idle session timeout

Authenticated pages mount `InactivityTimeout` in the platform shell. After a period without mouse, keyboard, scroll, or touch activity:

1. A warning toast appears (`Stay logged in` to extend the session).
2. If the user does not confirm, the app clears client caches and navigates to `/api/auth/logout`.

While the warning is visible, further pointer or keyboard activity does **not** extend the session — the user must click **Stay logged in** (same behavior as bankayo).

| Source | Default | Purpose |
|--------|---------|---------|
| Login payload `sessionIdleTimeoutMinutes` | `15` | Minutes until idle sign-out; `0` disables |
| Login payload `sessionIdleWarningSeconds` | `60` | Warning period before sign-out |
| `NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES` | same as above | Fallback when login payload omits idle policy (older servers, demo session) |
| `NEXT_PUBLIC_SESSION_IDLE_WARNING_SECONDS` | same as above | Fallback when login payload omits idle policy |

Values come from Fineract global configuration (`session-idle-timeout-minutes`, `session-idle-warning-seconds`) and are stored in the `mifos-session` cookie at sign-in.

This is independent of the httpOnly cookie TTL (8h / 14d): idle sign-out can end a session before the cookie expires.

## Preview / dev

| Variable | Purpose |
|----------|---------|
| `DEMO_SESSION_ENABLED=true` | Show “Continue with demo session” on login |
| `RBAC_DEV_SESSION` | JSON session when demo is enabled |
| `RBAC_ENABLED=false` | Skip permission checks (dev only) |

Disable demo flags in production.

## Not yet supported

- OAuth / OIDC (legacy web-app modes)
- Two-factor authentication (`isTwoFactorAuthenticationRequired`)
- In-app password renewal (`shouldRenewPassword`) — reset in Fineract first

## Sign out

Use **`GET /api/auth/logout`** (via `SignOutButton` / `SignOutMenuItem`):

1. Clears `mifos-session` on the **Route Handler redirect response** (reliable on Vercel; server actions + `redirect()` can drop `Set-Cookie`).
2. Redirects to `/login?signedOut=1`.

The Fineract server catalog cookie is **kept** so users can switch backends without re-entering URLs.

**Important:** Session is read **only** from `mifos-session`. Implicit `RBAC_DEV_SESSION` fallback was removed; use **Continue with demo session** when `DEMO_SESSION_ENABLED=true`.

Client-side TanStack Query caches are cleared before navigating to `/api/auth/logout`.

## Code

| Piece | Location |
|-------|----------|
| Fineract login | `apps/web/src/lib/fineract/authenticate.ts` |
| Cookie helpers | `apps/web/src/lib/session/cookie.ts` |
| Idle timeout | `apps/web/src/components/auth/inactivity-timeout.tsx` |
| Login Route Handler | `apps/web/src/app/api/auth/login/route.ts` |
| Legacy server action | `apps/web/src/actions/auth.ts` |
| Login UI | `apps/web/src/components/auth/login-form.tsx` |
| Route guard | `apps/web/src/proxy.ts` |

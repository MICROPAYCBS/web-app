# Authentication

Fineract **basic authentication** via the app BFF. The browser never calls `POST /authentication` directly.

## Flow

```text
1. /connect     — pick Fineract server (catalog cookie)
2. /login       — username + password form
3. Server Action — POST {baseUrl}/authentication (tenant header)
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

Public fields exposed to React via `getPublicSession()` / `SessionProvider` (no auth key).

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

`logoutAction` clears `mifos-session` and redirects to `/login`. Server catalog is kept.

## Code

| Piece | Location |
|-------|----------|
| Fineract login | `apps/web/src/lib/fineract/authenticate.ts` |
| Cookie helpers | `apps/web/src/lib/session/cookie.ts` |
| Server Action | `apps/web/src/actions/auth.ts` |
| Login UI | `apps/web/src/components/auth/login-form.tsx` |
| Route guard | `apps/web/src/proxy.ts` |

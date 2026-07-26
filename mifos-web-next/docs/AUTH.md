# Authentication

Fineract **basic authentication** via the app BFF. The browser never calls `POST /authentication` (or `/twofactor`) directly.

## Flow

```text
1. /login       — pick server (sheet) + username + password form
2. POST /api/auth/login — BFF → POST {baseUrl}/authentication
3a. No 2FA     — httpOnly cookie mifos-session; redirect home
3b. 2FA required — httpOnly cookie mifos-2fa-pending (Basic key + login payload); UI OTP step
4. OTP step    — GET delivery methods → POST request OTP → POST validate
5. On validate — mifos-session (+ twoFactorAccessToken); clear pending; redirect home
6. BFF routes  — Authorization: Basic {key} and, when present, Fineract-Platform-TFA-Token
```

## Two-factor authentication (2FA)

Enabled **on the Fineract server**, not per user in this UI:

| Layer | Mechanism |
|-------|-----------|
| Server | `fineract.security.2fa.enabled` / env `FINERACT_SECURITY_2FA_ENABLED` (default `false`) |
| User | Permission **`BYPASS_TWOFACTOR`** skips the OTP challenge (checked with Fineract `hasSpecificPermissionTo` — **`ALL_FUNCTIONS` does not imply bypass**) |
| Delivery | Tenant `twofactor_configuration` (email/SMS, OTP length/TTL) |

When the flag is on, every non-bypass user must complete OTP after a successful password login. Super users with only `ALL_FUNCTIONS` still see the OTP step unless their role also includes `BYPASS_TWOFACTOR`. There is no per-user “enable 2FA” toggle in this app. Admin configuration of `/v1/twofactor/configure` is out of scope here.

The pending cookie stores only credentials metadata (not the full permissions list) so it stays under browser cookie size limits; permissions are re-loaded from authentication after OTP validates.

### BFF routes

| Route | Fineract |
|-------|----------|
| `POST /api/auth/login` | On `isTwoFactorAuthenticationRequired`, sets `mifos-2fa-pending`; JSON `{ ok: true, needsTwoFactor: true }` |
| `GET /api/auth/twofactor/delivery-methods` | `GET /v1/twofactor` with Basic from pending cookie |
| `POST /api/auth/twofactor/request` | `POST /v1/twofactor?deliveryMethod=&extendedToken=` |
| `POST /api/auth/twofactor/validate` | `POST /v1/twofactor/validate?token=`; sets full `mifos-session` with TFA token |
| `POST /api/auth/twofactor/cancel` | Clears `mifos-2fa-pending` (return to password step) |

Pending cookie TTL is about **10 minutes**. Full `mifos-session` is not granted until OTP validates.

Outbound Fineract calls from `buildFineractRequestInit` / `createFineractClient` send `Fineract-Platform-TFA-Token` when the session has `twoFactorAccessToken`. Without it, Fineract returns **403** while 2FA is enabled.

## Session cookie

| Property | Value |
|----------|--------|
| Name | `mifos-session` |
| Content | JSON `ServerSession` (secrets stay httpOnly; includes optional `twoFactorAccessToken`) |
| Default TTL | 8 hours |
| Remember me | 14 days |
| Idle sign-out | From server global config via login (`sessionIdleTimeoutMinutes`, `sessionIdleWarningSeconds`); env vars are fallback |

| Pending 2FA | Value |
|-------------|--------|
| Name | `mifos-2fa-pending` |
| Content | Minimal login payload + Basic/Bearer key for OTP APIs |
| TTL | ~10 minutes |

Public fields exposed to React via `getPublicSession()` / `SessionProvider` (no auth keys or TFA token).

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
- In-app password renewal (`shouldRenewPassword`) — reset with your administrator first (also blocked after OTP if the login payload requires renewal)

## Sign out

Use **`GET /api/auth/logout`** (via `SignOutButton` / `SignOutMenuItem`):

1. Best-effort `POST /v1/twofactor/invalidate` when the session has a TFA token.
2. Clears `mifos-session` and `mifos-2fa-pending` on the **Route Handler redirect response** (reliable on Vercel; server actions + `redirect()` can drop `Set-Cookie`).
3. Redirects to `/login?signedOut=1`.

The Fineract server catalog cookie is **kept** so users can switch backends without re-entering URLs.

**Important:** Session is read **only** from `mifos-session`. Implicit `RBAC_DEV_SESSION` fallback was removed; use **Continue with demo session** when `DEMO_SESSION_ENABLED=true`.

Client-side TanStack Query caches are cleared before navigating to `/api/auth/logout`.

## Code

| Piece | Location |
|-------|----------|
| Fineract login | `apps/web/src/lib/fineract/authenticate.ts` |
| 2FA Fineract helpers | `apps/web/src/lib/fineract/twofactor.ts` |
| Cookie helpers | `apps/web/src/lib/session/cookie.ts`, `pending-twofactor.ts` |
| Idle timeout | `apps/web/src/components/auth/inactivity-timeout.tsx` |
| Login Route Handler | `apps/web/src/app/api/auth/login/route.ts` |
| 2FA Route Handlers | `apps/web/src/app/api/auth/twofactor/*` |
| Legacy server action | `apps/web/src/actions/auth.ts` |
| Login UI | `apps/web/src/components/auth/login-form.tsx` |
| Route guard | `apps/web/src/proxy.ts` |

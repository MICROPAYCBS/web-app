# Fineract server selection

Users work with a **named list** of Fineract backends (URL + tenant). The active server must be set **before login** and can be changed after sign-out or in settings.

## UX flow

```text
First visit → /login (Manage Fineract servers sheet)
           → select server → /login
           → (future) authenticate → app

Signed in  → header shows server name → /settings/servers
Sign out   → /login (same server pre-selected) → Manage servers sheet
```

| Screen | Purpose |
|--------|---------|
| `/login?servers=1` | Opens server manager sheet (add / edit / delete) |
| `/login` | Sign in to **active** server; link to change server |
| `/settings/servers` | Add / edit / remove / switch active; sign out |

## Storage

| Cookie | Content | httpOnly |
|--------|---------|----------|
| `mifos-server-catalog` | `{ servers[], activeServerId }` | yes |

Fineract URLs are stored server-side in this cookie. The browser never calls Fineract directly; `createFineractClient()` reads the **active** entry.

## Seed servers (optional)

```bash
FINERACT_SERVERS='[{"id":"demo","name":"Mifos Demo","baseUrl":"https://demo.mifos.community/fineract-provider/api/v1","tenantId":"default"}]'
```

Used only when the catalog cookie is empty (first visit).

## Middleware

1. No active server → redirect `/login?servers=1`
2. `/connect` → `/login?servers=1` (legacy URL)
3. No auth session → `/login`
4. Otherwise → app + RBAC

## API

Server mutations use **Server Actions** in `apps/web/src/actions/servers.ts` (not Fineract).

## Related

- [BFF.md](BFF.md) — server-to-server Fineract calls
- `@mifos/servers` — catalog types and helpers

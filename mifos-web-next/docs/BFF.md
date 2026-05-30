# Backend-for-frontend (BFF)

The browser **never** calls Apache Fineract directly. All Fineract traffic is **server-to-server** from the Next.js runtime.

## Why

| Risk with browser → Fineract | BFF mitigation |
|------------------------------|----------------|
| Exposed API base URL / tenant | `FINERACT_*` env vars are server-only |
| Leaked Basic/Bearer tokens in JS | Auth secrets stay in httpOnly session; stripped for client |
| CORS complexity | Same-origin `/api/*` only |
| Permission bypass via crafted requests | Server re-checks RBAC + Fineract enforces |

## Request flow

```text
Browser                    Next.js server              Fineract
   │                              │                        │
   │  GET /api/clients            │                        │
   │ ───────────────────────────► │  GET /clients          │
   │                              │ ─────────────────────► │
   │                              │ ◄───────────────────── │
   │ ◄─────────────────────────── │                        │
   │  JSON                        │                        │
```

Client Components use **TanStack Query** (or `fetch`) against **`/api/...`** or **Server Actions** — not `FINERACT_API_URL`.

## Implementation

| Piece | Location |
|-------|----------|
| Server config | `apps/web/src/lib/fineract/server-config.ts` (`import 'server-only'`) |
| Fineract client factory | `apps/web/src/lib/fineract/create-client.ts` |
| Route Handlers | `apps/web/src/app/api/**/route.ts` |
| Server Actions | `apps/web/src/actions/**` (same `createFineractClient()`) |
| Session (full) | `getServerSession()` — includes auth secrets |
| Session (browser) | `getPublicSession()` — permissions only, no tokens |

## Environment (server-only)

```bash
FINERACT_API_URL=https://localhost:8443/fineract-provider/api/v1
FINERACT_TENANT_ID=default
```

Do **not** use `NEXT_PUBLIC_FINERACT_*`.

## Adding an endpoint

1. Register RBAC in `permissions.manifest.json` if needed.
2. Create `app/api/<resource>/route.ts`:

```ts
import { createFineractClient } from '@/lib/fineract/create-client';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { jsonOk, jsonError } from '@/lib/bff/json-response';

export async function GET() {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) return error;
  try {
    const fineract = await createFineractClient();
    return jsonOk(await fineract.get('/clients'));
  } catch (e) {
    return jsonError(e);
  }
}
```

3. Client: `fetch('/api/clients')` or React Query `queryKey: ['clients']`.

## Login (future)

On successful `POST /authentication`:

1. Store **full** credentials in **httpOnly** `mifos-session` cookie.
2. Never return `base64EncodedAuthenticationKey` or `accessToken` in JSON to the client.
3. `SessionProvider` receives `getPublicSession()` from the server layout only.

## Anti-patterns

- `fetch(process.env.NEXT_PUBLIC_FINERACT_API_URL + …)` in `'use client'` files
- Importing `createFineractClient` in Client Components (blocked by `server-only`)
- Proxying Fineract in `next.config` rewrites for browser use — dev server may call Fineract directly via `FINERACT_API_URL`

## Related

- [ADR-008](adr/008-bff-server-only-fineract.md)
- [RBAC.md](RBAC.md)

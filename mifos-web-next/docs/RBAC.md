# Role-based access control (RBAC)

Fineract assigns permissions to roles; users receive a `permissions: string[]` array at login (`POST /authentication`). This app enforces access in **four layers**.

## Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| API | Apache Fineract | Source of truth — returns 401/403 |
| Server | Server Actions | `assertCan(session, …)` before mutations |
| Route | `middleware.ts` | Auth + `getRoutePermission(path)` |
| UI | `<Can>`, filtered nav | Hide/disable actions |

**Never rely on UI alone.** Always guard Server Actions and expect Fineract to reject unauthorized API calls.

## Permission rules

Implemented in `@mifos/auth` (`can()`), matching openMF/web-app `HasPermissionDirective`:

| Code | Effect |
|------|--------|
| `ALL_FUNCTIONS` | Allow everything |
| `ALL_FUNCTIONS_READ` | Allow any permission starting with `READ_` |
| Exact code | e.g. `CREATE_CLIENT`, `READ_LOAN` |
| `string[]` | **OR** — any match grants access |
| `{ any: [...] }` / `{ all: [...] }` | Explicit OR / AND |

Unlike the reference app, **RBAC is on by default** (`RBAC_ENABLED` must be `'false'` to disable).

## Semantic permission keys

Feature code should prefer **semantic keys** from `packages/auth/permissions.manifest.json`:

```ts
import { resolvePermission } from '@mifos/auth';

can(user, resolvePermission('clients.create'));
```

```tsx
<Can permission={resolvePermission('clients.create')}>
  <Button>New client</Button>
</Can>
```

Add entries as you implement domains. Grep web-app `mifosxHasPermission` to discover Fineract codes.

## Navigation & routes

- **Sidebar:** `filterNavForUser(session)` over `NAV_MANIFEST` in `@mifos/auth`
- **Routes:** `ROUTE_MANIFEST` prefix → permission; extend in `packages/auth/src/route-manifest.ts`

## Session (current)

| Mechanism | Notes |
|-----------|--------|
| Cookie `mifos-session` | JSON `SessionUser` — replace with encrypted server session before production |
| `RBAC_DEV_SESSION` | Dev-only JSON when login is not wired |
| `getServerSession()` | Server Components / layout |

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `RBAC_ENABLED` | `true` (unset) | Set `false` to bypass route/UI checks |
| `RBAC_DEV_SESSION` | — | Dev JSON session (non-production) |

Example `apps/web/.env.local`:

```bash
RBAC_DEV_SESSION={"userId":1,"username":"dev","officeId":1,"permissions":["READ_CLIENT","CREATE_CLIENT"]}
```

Test forbidden route: use permissions without `READ_CLIENT` and open `/clients`.

## Server Actions

```ts
import { assertCan, resolvePermission } from '@mifos/auth';
import { getServerSession } from '@/lib/session/server';

export async function createClientAction(data: unknown) {
  const session = await getServerSession();
  assertCan(session, resolvePermission('clients.create'));
  // … call Fineract
}
```

## Maker-checker

Separate from RBAC. Use permission keys like `checkerInbox` in the manifest (OR list of approve/read checker codes). See reference web-app checker menu.

## Related

- [ADR-007](adr/007-rbac.md)
- [COMPONENTS.md](COMPONENTS.md) — UI patterns with `<Can>`

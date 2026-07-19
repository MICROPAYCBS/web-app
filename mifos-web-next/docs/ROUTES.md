# Typed route registry

All app routes are defined once in **`packages/routes/src/app-routes.ts`** (`APP_ROUTES`). Everything else is derived.

## Three uses (one source)

| Use | Mechanism |
|-----|-----------|
| **Type-safe navigation** | `routePath('clients')` + `<AppLink route="clients" />` |
| **RBAC & nav** | `@mifos/auth` imports `buildNavManifest()`, etc. from `@mifos/routes/server` |
| **Parity tracking** | `parity` on each route + `docs/parity/generated.json` |

Next.js also generates **`AppRoutes`** from the filesystem (`experimental.strictRouteTypes`). Keep **both** in sync when adding a page.

## Adding a route

1. Create the Next.js page under `apps/web/src/app/...`
2. Add an entry to `APP_ROUTES` in `app-routes.ts`:

```ts
clientsCreate: {
  id: 'clientsCreate',
  path: '/clients/create',
  kind: 'page',
  label: 'Create client',
  domain: 'clients',
  permissionKey: 'clients.create',
  requiresServer: true,
  requiresAuth: true,
  parity: {
    status: 'todo',
    webAppRef: 'clients/create-client',
    fineractApi: 'POST /clients',
    schemaId: 'clients.create'
  }
}
```

3. Run `pnpm run build` (updates Next `AppRoutes`) and `pnpm run routes:parity`
4. Use in code:

```tsx
import { AppLink } from '@/components/routes/app-link';
import { routePath } from '@mifos/routes';

<AppLink route="clients">Clients</AppLink>
redirect(routePath('login'));
```

## Parity export

```bash
pnpm run routes:parity
```

Writes `docs/parity/generated.json` with status counts and per-route metadata.

## API routes

Register BFF handlers in `APP_ROUTES` with `kind: 'api'` and `permissionKey` so middleware/RBAC helpers stay consistent.

## Related

- [ADR-009](adr/009-typed-route-registry.md)
- [parity/README.md](parity/README.md)


## Package exports

| Import | Use in |
|--------|--------|
| `@mifos/routes` | Client components — `routePath`, `AppLink`, `APP_ROUTES` |
| `@mifos/routes/server` | Server, middleware, auth — RBAC/nav derivation |
| `@mifos/routes/parity` | Tooling — `pnpm run routes:parity` |

Do not import `@mifos/routes/server` from client components (pulls derivation logic into the browser bundle).

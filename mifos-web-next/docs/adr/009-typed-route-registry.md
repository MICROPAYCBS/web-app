# ADR-009: Typed route registry (@mifos/routes)

## Status

Accepted

## Context

We need type-safe links, RBAC/nav derivation, and parity tracking without duplicating path strings across middleware, sidebar, and docs.

## Decision

Maintain **`APP_ROUTES`** in `@mifos/routes` as the canonical registry. Each entry includes path, domain, nav flags, auth flags, `permissionKey`, and `parity` metadata.

- `@mifos/auth` derives nav and route permission manifests from `@mifos/routes/server`.
- Client code imports only `@mifos/routes` (paths/registry); server code uses `@mifos/routes/server`.
- `AppLink` / `routePath()` provide stable ids for navigation in app code.
- `pnpm run routes:parity` exports `docs/parity/generated.json`.
- Next.js `strictRouteTypes` remains enabled for filesystem-generated `AppRoutes`.

## Consequences

- New pages require an `APP_ROUTES` entry and a filesystem route.
- Permission keys in routes must exist in `permissions.manifest.json`.
- Do not hand-edit `NAV_MANIFEST` / `ROUTE_MANIFEST` arrays in auth (they are derived).

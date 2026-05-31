# Admin / config navigation audit

Parity source: legacy Mifos web-app routing (`organization`, `system`, `products`, `accounting`, `appusers`, `templates`, `reports`) and `src/app/home/activities.ts`.

## Registry

| Package | Role |
|---------|------|
| `packages/routes/src/admin-nav-routes.ts` | 56 admin list routes (factory input) |
| `packages/routes/src/admin-route-factory.ts` | `defineAdminRoute`, `adminRoutesToRecord` |
| `packages/routes/src/app-routes.ts` | `CORE_APP_ROUTES` + merged `ADMIN_NAV_ROUTES` |
| `packages/auth/permissions.manifest.json` | RBAC keys per nav item |

## Sidebar groups

| Group | Count | Notes |
|-------|------:|-------|
| Organization | 19 | Hub `/organization` hidden (`nav: false`) |
| System | 16 | New `system` nav group |
| Products | 9 | Loan/savings products remain on core routes |
| Accounting | 9 | Hub `/accounting` hidden |
| Administration | 3 | `/appusers`, `/templates`, `/reports` |

Portfolio operational lists (clients, loans, savings, …) stay on existing core routes; detail flows are out of scope for this audit.

## Placeholder pages

Catch-all registry pages resolve labels via `findRouteByPath` and render `ComingSoonPage`:

- `(platform)/organization/[...slug]`
- `(platform)/system/[...slug]`
- `(platform)/products/[...slug]` (static `loan-products` / `savings-products` pages take precedence)
- `(platform)/accounting/[...slug]`
- `(platform)/appusers`, `templates`, `reports`, `checker-inbox-and-tasks`

## Follow-ups

- Implement screens by priority; wire Fineract APIs per `parity.webAppRef`.
- Fineract object Quick Find (clients, loans, savings).
- Align `saving-products` vs `savings-products` path with deployment conventions if needed.
- Validate RBAC keys against a low-privilege Fineract user on sandbox.

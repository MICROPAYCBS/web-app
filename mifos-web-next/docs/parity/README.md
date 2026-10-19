# Route and screen inventory (frozen)

**Frozen 2026-10-19.** Aligned to openMF/web-app as of that date. **No further Angular-driven work.**

The product bar is Micropay Fineract staff operations (see [PROJECT.md](../PROJECT.md) and [ARCHITECTURE.md](../ARCHITECTURE.md)). Leftover Angular screens are closed in **[FROZEN.md](FROZEN.md)** (keep = backlog, drop = not a goal).

## Generated matrix

```bash
pnpm run routes:parity
```

Writes **[generated.json](generated.json)** from `@mifos/routes` (`APP_ROUTES`). That dump is this app’s route registry, not an Angular comparison. New routes need `fineractApi` (and a Zod `schemaId` on writes). `webAppRef` on old entries is optional history.

## Domain notes (archaeology)

| Domain | Notes |
|--------|--------|
| Clients | [clients.md](clients.md) |
| Groups | [groups.md](groups.md) |
| Centers | [centers.md](centers.md) |
| Tasks | [tasks.md](tasks.md) |
| Products | [products.md](products.md) |
| System | [system.md](system.md) |
| Accounting | [accounting.md](accounting.md) |
| Organization | [organization.md](organization.md) |
| Financial reports | [financial-reports.md](financial-reports.md) |

Do not grow these files for new Angular gaps. Update operator docs in the sibling `documentation` repo and Fineract manifests when the write contract changes.

## Template

[\_template.md](_template.md) is unused for new Angular tables. Prefer ADRs and operator docs.

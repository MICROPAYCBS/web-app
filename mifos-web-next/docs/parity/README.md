# Feature parity tracking

Track implementation status against [openMF/web-app](https://github.com/openMF/web-app).

## Generated matrix

```bash
pnpm run routes:parity
```

Produces **[generated.json](generated.json)** from `@mifos/routes` (`APP_ROUTES.parity`).

## Domains

| Domain                 | Status      | Parity doc               |
| ---------------------- | ----------- | ------------------------ |
| Platform (auth, shell) | In progress | —                        |
| Clients                | In progress | [clients.md](clients.md) |
| System (admin)         | In progress | [system.md](system.md)   |
| Loans                  | Not started | —                        |
| Accounting             | Not started | —                        |

## Manual notes

Use domain markdown files for narrative notes. **Route list** lives in `packages/routes/src/app-routes.ts` only.

## Template

[\_template.md](_template.md) for free-form domain notes (not duplicate route tables).

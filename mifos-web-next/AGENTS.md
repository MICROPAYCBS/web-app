# AGENTS.md — Mifos Web Next

Instructions for AI agents working in this repository.

## Project context

**Private, solo-maintained** Fineract UI. Not a community contribution to [openMF/web-app](https://github.com/openMF/web-app). See [docs/PROJECT.md](docs/PROJECT.md).

**Next.js 16.2.6**, App Router only, **shadcn/ui** with **preset-based** theming (`@mifos/themes`).

## Monorepo

| Package | Purpose |
|---------|---------|
| `apps/web` | Next.js app — routes, providers, shadcn components |
| `@mifos/api-client` | Fineract REST client |
| `@mifos/validation` | Zod schemas + `manifests/*.json` (Fineract-sourced rules) |
| `@mifos/domain` | Pure TS (money, permissions helpers) |
| `@mifos/i18n` | Fineract globalisation codes |
| `@mifos/themes` | CSS presets — swap LAF via `data-preset` on `<html>` |
| `@mifos/routes` | Canonical `APP_ROUTES` registry |
| `@mifos/auth` | RBAC: `can`, `<Can>`, nav/route manifests |
| `@mifos/ui` | Composite UI (AppShell, DataTable, …) |

## Rules

1. **No hardcoded colors** in components — use semantic Tailwind tokens (`bg-background`, `text-primary`, …).
2. **Every write form** must have a Zod schema in `@mifos/validation` and a manifest entry citing Fineract Java sources.
3. **Validate on server** (Server Actions) with the same Zod schema as the client.
4. **Map Fineract API errors** via `mapFineractErrors` + `translateFineractCode`.
5. Use **decimal.js** (via `@mifos/domain`) for money — never JavaScript `number` for amounts.
6. **Simple forms (1–7 fields)** use `FormSheet` (shadcn Sheet) with Cancel/Submit in the footer — see `docs/COMPONENTS.md` and ADR-006.
7. Add new pages to `packages/routes/src/app-routes.ts` and run `pnpm run routes:parity`.
8. **RBAC:** register permissions in `@mifos/auth`; use `<Can>` + `assertCan()` — see `docs/RBAC.md`.
9. Update **parity matrix** (`docs/parity/`) when shipping a route.
10. **Never call Fineract from the browser** — use `createFineractClient()` / `/api/*` BFF only (`docs/BFF.md and `docs/SERVERS.md``).
11. Do **not** apply openMF community PR conventions (Jira `WEB-*`, Slack approval, squash rules) unless the maintainer explicitly asks.
12. **User-facing copy** must not mention Fineract, APIs, or backend product names unless unavoidable (e.g. a technical settings field). Prefer domain language users know: “Client addresses”, “Family members”, “Servers”, “Sign in”. Code, comments, and docs for developers may still reference Fineract.

## Reference repos

Pin in `reference/` (not committed):

- `reference/web-app` — behavior and routes (reference only)
- `reference/fineract` — validation source of truth

## Commands

```bash
pnpm run dev
pnpm run build
pnpm run lint
pnpm run typecheck
```

## UI

Add shadcn components from `apps/web`:

```bash
cd apps/web && pnpm dlx shadcn@latest add <component>
```

Prefer composites in `@mifos/ui` for patterns used across domains.

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
| `@mifos/ui` | Composite UI (AppShell, DataTable, …) |

## Rules

1. **No hardcoded colors** in components — use semantic Tailwind tokens (`bg-background`, `text-primary`, …).
2. **Every write form** must have a Zod schema in `@mifos/validation` and a manifest entry citing Fineract Java sources.
3. **Validate on server** (Server Actions) with the same Zod schema as the client.
4. **Map Fineract API errors** via `mapFineractErrors` + `translateFineractCode`.
5. Use **decimal.js** (via `@mifos/domain`) for money — never JavaScript `number` for amounts.
6. Update **parity matrix** (`docs/parity/`) when shipping a route.
7. Do **not** apply openMF community PR conventions (Jira `WEB-*`, Slack approval, squash rules) unless the maintainer explicitly asks.

## Reference repos

Pin in `reference/` (not committed):

- `reference/web-app` — behavior and routes (reference only)
- `reference/fineract` — validation source of truth

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## UI

Add shadcn components from `apps/web`:

```bash
cd apps/web && npx shadcn@latest add <component>
```

Prefer composites in `@mifos/ui` for patterns used across domains.

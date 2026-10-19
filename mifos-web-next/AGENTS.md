# AGENTS.md — Mifos Web Next

Instructions for AI agents working in this repository.

## Project context

**Private, solo-maintained** Micropay Fineract staff UI. Not a community contribution to openMF/web-app. Angular is a frozen inventory — see [docs/PROJECT.md](docs/PROJECT.md) and [docs/parity/FROZEN.md](docs/parity/FROZEN.md).

Open **this folder** as the Cursor workspace. Ignore any parent `web-app/AGENTS.md` (Angular / Jira `WEB-*` / Material).

**Next.js 16.4.2**, App Router only, **shadcn/ui** with **preset-based** theming (`@mifos/themes`).

## Monorepo

| Package | Purpose |
|---------|---------|
| `apps/web` | Next.js app — routes, providers, shadcn components |
| `@mifos/api-client` | Fineract REST client |
| `@mifos/validation` | Zod schemas + `manifests/*.json` (Fineract-sourced rules) |
| `@mifos/domain` | Pure TS (money, permissions helpers) |
| `@mifos/i18n` | Fineract globalisation codes |
| `@mifos/themes` | CSS presets — swap LAF via `data-preset` on `<html>` (`heritage`, `neutral`, `micropay`) |
| `@mifos/routes` | Canonical `APP_ROUTES` registry |
| `@mifos/auth` | RBAC: `can`, `<Can>`, nav/route manifests |
| `@mifos/ui` | Composite UI (AppShell, DataTable, …) |

## Rules

1. **No hardcoded colors** in components — use semantic Tailwind tokens (`bg-background`, `text-primary`, …).
2. **Every write form** must have a Zod schema in `@mifos/validation` and a manifest entry citing Fineract Java sources.
3. **Validate on server** (Server Actions) with the same Zod schema as the client.
4. **Map Fineract API errors** via `mapFineractErrors` + `translateFineractCode`.
5. Use **decimal.js** (via `@mifos/domain`) for money — never JavaScript `number` for amounts.
6. **Currency display** — always use the ISO **code** (`UGX`, `USD`, …) via `formatAccountMoney`; never Fineract `displaySymbol` or locale symbols in UI copy.
7. **Simple forms (1–7 fields)** use `FormSheet` (shadcn Sheet) with Cancel/Submit in the footer — see `docs/COMPONENTS.md` and ADR-006.
8. Add new pages to `packages/routes/src/app-routes.ts` with `fineractApi` (and `schemaId` on writes). `webAppRef` is optional history — do not add it on new routes. `pnpm run routes:parity` dumps the registry; it is not an Angular comparison.
9. **RBAC:** register permissions in `@mifos/auth`; use `<Can>` + `assertCan()` — see `docs/RBAC.md`.
10. **Never call Fineract from the browser** — use `createFineractClient()` / `/api/*` BFF only (`docs/BFF.md` and `docs/SERVERS.md`).
11. Do **not** apply openMF community PR conventions (Jira `WEB-*`, Slack approval, squash rules) unless the maintainer explicitly asks. Do not copy Angular forms when Fineract or Micropay UX already diverges.
12. **User-facing copy** must not mention Fineract, APIs, or backend product names unless unavoidable (e.g. a technical settings field). Prefer domain language users know: “Customer addresses”, “Family members”, “Servers”, “Sign in”. Code, comments, and docs for developers may still reference Fineract.
13. **Business date on transaction forms** — posting and operation dates (deposits, transfers, journal entries, lifecycle commands, etc.) must use `TransactionDateField` and the shared business-date context — see `docs/COMPONENTS.md` § Business date & transaction dates. Do **not** use plain `DateField` or `new Date()` for those fields. Search/filter date ranges and profile or planning dates (DOB, expected disbursement, holidays) stay editable `DateField`s.
14. **User-facing UI changes need a docs PR in `documentation`.** Operator/admin how-tos live in the sibling **Micropay CBS Docs** repo (`../documentation`, Fumadocs), not in `docs/user-guide/` (retired seed). When you ship or change a user-facing screen/flow, update the matching page under `content/docs/end-users/` or `content/docs/administrators/` there. Developer ADRs stay in this repo’s `docs/`. Do not update `docs/parity/` unless amending the frozen keep/drop list.

## Reference repos

Pin in `reference/` (not committed). **Optional.** New screens do not require reading Angular.

- `reference/fineract` — validation source of truth (prefer the sibling Micropay Fineract repo)
- `reference/web-app` — frozen Angular archive clone; not required reading

## Commands

```bash
pnpm run dev
pnpm run clean    # delete apps/web/.next — stop the dev server first
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm run check      # typecheck — runs on commit for docs-only mifos-web-next changes
pnpm run check:ci   # typecheck + production build — Vercel / GitHub CI gate; runs on commit when app code changes
pnpm run check:lint # eslint (not yet in the commit hook; many legacy findings)
```

## UI

Add shadcn components from `apps/web`:

```bash
cd apps/web && pnpm dlx shadcn@latest add <component>
```

Prefer composites in `@mifos/ui` for patterns used across domains.

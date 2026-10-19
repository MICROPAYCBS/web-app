# AGENTS.md — Mifos Web Next

Instructions for AI agents working in this repository.

## Project context

**Private, solo-maintained** Micropay Fineract staff UI. Not a community contribution to openMF/web-app. Angular is a frozen inventory — see [docs/PROJECT.md](docs/PROJECT.md) and [docs/parity/FROZEN.md](docs/parity/FROZEN.md).

Open **this folder** as the Cursor workspace. Ignore any parent `web-app/AGENTS.md`.

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
| `@mifos/auth` | RBAC: `can`, `<Can>`, nav/route manifests |
| `@mifos/ui` | Composite UI (AppShell, DataTable, …) |

## Rules

1. **No hardcoded colors** in components — use semantic Tailwind tokens (`bg-background`, `text-primary`, …).
2. **Every write form** must have a Zod schema in `@mifos/validation` and a manifest entry citing Fineract Java sources.
3. **Validate on server** (Server Actions) with the same Zod schema as the client.
4. **Map Fineract API errors** via `mapFineractErrors` + `translateFineractCode`.
5. Use **decimal.js** (via `@mifos/domain`) for money — never JavaScript `number` for amounts.
6. **Simple forms (1–7 fields)** use `FormSheet` (shadcn Sheet) with Cancel/Submit in the footer — see `docs/COMPONENTS.md` and ADR-006.
7. **RBAC:** register permissions in `@mifos/auth`; use `<Can>` + `assertCan()` — see `docs/RBAC.md`.
8. Add new pages to `packages/routes/src/app-routes.ts` with `fineractApi` (and `schemaId` on writes). Do not add `webAppRef` on new routes.
9. **Never call Fineract from the browser** — use `createFineractClient()` / `/api/*` BFF only (`docs/BFF.md`).
10. Do **not** apply openMF community PR conventions (Jira `WEB-*`, Slack approval, squash rules). Do not copy Angular forms when Fineract or Micropay UX already diverges.
11. User-facing UI changes need a docs PR in the sibling `documentation` repo. Do not update `docs/parity/` unless amending the frozen keep/drop list.

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
```

## Fineract backend (1.16 + all Micropay modifications)

The UI talks to the Micropay distribution, not upstream-only Fineract. In the sibling Fineract repo (`../fineract` or `reference/fineract`), use the Quick Start command from that repo’s `README.md`:

```bash
# start backend — Apache Fineract 1.16 plus every Micropay modification
# (custom/micropay/** modules, replacements, and moved endpoints).
# Do not use :fineract-provider:devRun / :fineract-provider:bootRun for this.
./gradlew :custom:micropay:app:boot:devRun
```

API base: `https://localhost:8443/fineract-provider`. Wait for `APACHE FINERACT IS READY` before signing in.

## UI

Add shadcn components from `apps/web`:

```bash
cd apps/web && pnpm exec shadcn@latest add <component>
```

Prefer composites in `@mifos/ui` for patterns used across domains.


## Deploy on Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. **Root Directory:** `mifos-web-next` while nested in `web-app`; `.` (repo root) after this tree is extracted — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
3. Add environment variables from `apps/web/.env.vercel.example`.

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

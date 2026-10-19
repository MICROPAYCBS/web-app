# Architecture


## Governance

Private, solo-maintained — see [PROJECT.md](PROJECT.md) and [ADR-004](adr/004-private-solo-maintained.md). openMF/web-app is a **frozen inventory**, not a product bar.

## Goals

1. Cover **Micropay Fineract** staff operations (portfolio, products, accounting, organization, system).
2. Superior UI/UX via shadcn/ui and composite components.
3. **Fineract-first validation** — rules proven against Fineract Java sources and Zod manifests.
4. **Preset-driven LAF** — change look-and-feel by swapping `@mifos/themes` presets.

## Stack

- **Next.js 16.4.2** — App Router, Turbopack, `experimental.strictRouteTypes`
- **React 19** — via Next.js App Router
- **shadcn/ui** — Tailwind v4, CSS variables, `new-york` / `base-nova` style
- **TanStack Query** — client mutations and cache
- **React Hook Form + Zod** — forms; schemas in `@mifos/validation`

## Layered architecture

```text
 Browser ──► /api/* & Server Actions (same origin)
                    │
                    ▼
┌─────────────────────────────────────────┐
│  apps/web server (BFF, RBAC, session)   │
│  createFineractClient() [server-only]   │
├─────────────────────────────────────────┤
│  @mifos/validation · @mifos/auth · …    │
└─────────────────────────────────────────┘
           │ server-to-server
           ▼
    Apache Fineract REST API
```

See [BFF.md](BFF.md). The browser never calls Fineract directly.

## Validation pipeline

1. **Manifest** (`packages/validation/manifests/*.json`) — documents Fineract Java sources per command.
2. **Zod schema** — generated/maintained from manifest; used client- and server-side.
3. **API errors** — `mapFineractErrors()` maps `parameterName` to form fields.

## Routing

| Group | Path | Purpose |
|-------|------|---------|
| `(auth)` | `/login`, `/callback` | Authentication |
| `(platform)` | `/`, `/clients`, … | Authenticated shell |

Use normal paths (no hash routing). New `APP_ROUTES` entries cite `fineractApi` (and a Zod `schemaId` on writes). `webAppRef` on existing entries is optional history.

Request guards run in `apps/web/src/proxy.ts` (Next.js 16; replaces deprecated `middleware.ts`).

## Theming

- Custom `ThemeProvider` — `class` strategy for light/dark; `data-preset` for named palettes
- `data-preset` on `<html>` — `heritage` (default), `neutral`, `micropay`
- Presets live in `packages/themes/presets/*.css`; the choice persists in `localStorage` (`color-preset`)

## Backlog

Leftover Angular screens are closed in [`docs/parity/FROZEN.md`](parity/FROZEN.md) (**keep** = Micropay backlog, **drop** = not a goal). Operator how-tos live in the sibling `documentation` repo.

## References

- ADR-001: Greenfield repo (`docs/adr/001-greenfield-repo.md`)
- ADR-002: Fineract version matrix (`docs/adr/002-fineract-versions.md`)
- ADR-003: Validation manifest required (`docs/adr/003-validation-manifest.md`)

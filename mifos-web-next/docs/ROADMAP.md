# Roadmap

Living backlog for **mifos-web-next**. Parity counts come from `npm run routes:parity` → `docs/parity/generated.json`.

## Phase 0 — Platform (current)

| Item | Status |
|------|--------|
| Monorepo, BFF, RBAC, multi-server | Done |
| Typed `APP_ROUTES` + parity export | Done |
| Vercel-style nav + Quick Find | Done |
| Vercel deploy + demo session | Done |
| `middleware.ts` → `proxy.ts` (Next 16) | Done |
| React 19–safe theme provider | Done |
| CI (build + typecheck) | In progress |

## Phase 1 — Usable preview (next)

| Item | Status |
|------|--------|
| Fineract authentication (basic auth → httpOnly session) | Done |
| Clients list (DataTable + TanStack Query + BFF) | Todo |
| Client detail route | Todo |
| Form composites (`SelectField`, `DateField`, `MoneyField`) | Todo |
| Pin Fineract version + one contract test (ADR-002) | Todo |

## Phase 2 — Domain expansion

| Item | Status |
|------|--------|
| Client create (FormSheet + Zod manifest) | Todo |
| Loans / savings vertical slices | Todo |
| Wizard + settings layouts (large forms) | Todo |
| Route inventory script from Angular `*-routing.module.ts` | Todo |
| `APP_ROUTES` ↔ Next `strictRouteTypes` CI check | Todo |

## Phase 3 — Parity & polish

| Item | Status |
|------|--------|
| i18n strategy (UI strings) | Todo |
| Quick Find: recents + entity search (clients) | Todo |
| In-context nav (client / loan sub-nav) | Todo |
| Mobile bottom nav | Todo |
| Reports, collections, templates domains | Todo |
| Legacy `/#/` hash redirects | Todo |

## Phase 4 — Production hardening

| Item | Status |
|------|--------|
| Remove demo session from production | Todo |
| BFF rate limits + structured logging | Todo |
| Encrypted server credential storage | Todo |
| E2E smoke on Vercel preview | Todo |

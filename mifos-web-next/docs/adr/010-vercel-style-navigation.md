# ADR-010: Vercel-style navigation

## Status

Accepted

## Context

The legacy Mifos X Web App exposes dozens of sidenav links. A flat list in the greenfield app would overwhelm users. Vercel's 2025–2026 dashboard navigation combines a resizable sidebar with collapsible groups, featured shortcuts, and universal Quick Find (`⌘K`).

## Decision

1. Extend `APP_ROUTES` with `navFeatured`, `navGroup`, `navIcon`, and `keywords`.
2. Derive `NavStructure` (featured + groups + quickFind) via `buildNavStructure()`.
3. Render Quick Find with shadcn `Command` + global keyboard shortcut.
4. Pin **Clients**, **Loans**, and **Savings accounts** in the featured row.

## Consequences

- Many routes can exist in the registry before pages ship (`parity: todo` → "Soon" in UI).
- Auth continues to filter nav server-side.
- Future: recent items in Quick Find, mobile bottom bar (Vercel mobile pattern).

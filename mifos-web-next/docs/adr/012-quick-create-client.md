# ADR-012: Quick Create — prominent client creation

## Status

Accepted (documentation); platform UI **not yet implemented**.

## Context

Apache Fineract centers on **clients** (customers): loans, savings, groups, and centers attach to clients. The legacy Mifos X Web App exposes create-client early in workflows; the greenfield app should make **Create client** impossible to miss.

The shadcn **dashboard-01** block places a **Quick Create** control at the top of the sidebar navigation (`nav-main.tsx`): a primary-styled `SidebarMenuButton` (`bg-primary`, plus icon, “Quick Create” label) above regular nav links. That is the visual and placement reference — not a multi-entity demo menu.

Today the greenfield shell has:

- Featured nav links (Clients, Loans, Savings) in the sidebar
- Header **Find** (navigation search)
- No global create action

Client creation on `/clients` is a disabled “New client (coming soon)” button with `clients.create` RBAC only.

## Decision

### Product priority

**Create client** is the **primary platform action** — more prominent than generic “add” on individual list pages.

Secondary creates (group, center, loan account, savings account) may appear later in the same control as a **dropdown**, but **client** is always the default / first item and may remain a dedicated single button until those flows exist.

### Placement (dashboard-01–inspired)

| Location | Role |
|----------|------|
| **Sidebar** — directly under branding, **above** navigation Find | **Quick Create** (primary). Same visual weight as dashboard-01: full-width primary `SidebarMenuButton`, Lucide `circle-plus` (or `user-plus` for client-only phase). |
| **Clients list** (`ListPage` actions) | Secondary **New client** — same permission, same handler; users who navigated via featured link still see create on the page. |
| **Header** | **No** Quick Create in v1 — keep header for sidebar trigger + Find only (ADR-010). Avoid competing primary buttons. |

Collapsed sidebar (icon mode): Quick Create shows icon + tooltip (“Create client” / “Quick Create”).

### Component

- **`QuickCreate`** composite in `components/platform/` (platform chrome, like sidebar — not domain composite).
- Phase 1: single action → opens **Create client** (FormSheet if ≤7 fields after manifest, else `/clients/create` full page per ADR-006 / validation manifest).
- Phase 2: `DropdownMenu` from same button (or split button): Client · Group · Center · Loan · Savings — each item gated by `permissionKey` from `@mifos/routes` / manifest.

Do **not** import dashboard-01 `nav-main.tsx` wholesale (Tabler icons, Inbox demo button). Reimplement with Lucide + Mifos RBAC.

### Permissions

- Quick Create visible only if `can(user, resolvePermission('clients.create'))` (`CREATE_CLIENT`).
- Phase 2 menu items each use their own permission keys (`clients.create`, `loans.create`, etc.).

### Routes registry

- Keep `clients` featured in nav (`navFeatured`) — ADR-010.
- Document create targets in route `parity` / future `createPath` or platform actions manifest when implemented.
- Quick Create does not replace registry entries; it **starts** the dominant create flow from anywhere in the shell.

### Copy and i18n

- Phase 1 label: **Create client** (clearer than generic “Quick Create” for Fineract users). Tooltip may say “Quick Create”.
- When Phase 2 ships, top-level control label may return to **Quick Create** with Client as first menu row.

## Consequences

- Implement `QuickCreate` in `mifos-app-sidebar.tsx` (or adjacent module) after client create form scope is known (sheet vs page).
- Detail pages after create: [ADR-013](013-read-only-detail-pages.md).
- List/table work (ADR-011) should still put **New client** on the clients list for consistency with other resources.
- ADR-010 featured row remains; Quick Create is additive, not a replacement for **Clients** shortcut.

## References

- [COMPONENTS.md — Quick Create](../COMPONENTS.md#quick-create-prominent-client-creation)
- [ADR-010](010-vercel-style-navigation.md) — sidebar / Find
- [ADR-006](006-form-sheet-pattern.md) — create client form presentation
- shadcn dashboard-01 `nav-main.tsx` (Quick Create styling reference)

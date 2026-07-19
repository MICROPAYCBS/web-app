# Navigation (Vercel-inspired)

MicroPay Banking avoids overwhelming users with a flat list of every backend screen. Navigation is derived from `@mifos/routes` and rendered in three layers—similar to the [Vercel dashboard](https://vercel.com/changelog/dashboard-navigation-redesign-rollout) (sidebar groups, universal search, keyboard shortcuts).

## Layers

| Layer | UI | Purpose |
|-------|-----|---------|
| **Quick access** | Featured row in sidebar | Clients, Loans, Savings accounts—daily workflows |
| **Grouped sidebar** | Collapsible sections | Overview, Portfolio, Products, …—nested links without clutter |
| **Quick Find** | Header search + `⌘K` / `Ctrl+K` | Jump to any registered page; keywords + RBAC filtered |

## Registry fields

On each `APP_ROUTES` entry:

| Field | Purpose |
|-------|---------|
| `navFeatured` | Pin to sidebar shortcut row |
| `navGroup` | Collapsible section id |
| `navIcon` | Lucide icon in sidebar / Quick Find |
| `keywords` | Extra Quick Find search terms |
| `quickFind: false` | Exclude from command palette (auth pages, APIs) |

Groups are defined in `packages/routes/src/nav-groups.ts`.

## RBAC

`filterNavStructure(user, buildNavStructure())` runs in the platform layout (server). Sidebar and Quick Find only show routes the user may access.

## Adding a screen

1. Add `APP_ROUTES` entry with `navGroup` / `navFeatured` as appropriate.
2. Create the Next.js page.
3. Set `parity.status` to `in_progress` or `done` when the page is navigable (`soon` disables links).
4. Run `pnpm run routes:parity`.

## Client vs server

- **Server:** `buildNavStructure()` from `@mifos/routes/server`
- **Client:** `PlatformShell`, `QuickFind`, `PlatformSidebar`—receive serialized `PlatformNavStructure` only

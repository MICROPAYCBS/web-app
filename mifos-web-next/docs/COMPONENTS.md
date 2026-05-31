# UI component standards

Private project design system. Feature screens use **composites** — not raw shadcn primitives — except when building a new composite.

## Layers

| Layer | Location | Use |
|-------|----------|-----|
| Primitives | `apps/web/src/components/ui/` | shadcn CLI only |
| Composites | `apps/web/src/components/composites/` | All feature UIs |
| Platform chrome | `apps/web/src/components/platform/` | Shell: sidebar, header, Quick Create, Find |
| Shared layout | `@mifos/ui` | Framework-agnostic shells (`AppShell`, …) |

**Terminology:** shadcn docs sometimes say “atoms”; here **primitives** = `ui/`, **composites** = reusable patterns built from primitives (tables, fields, sheets).

## Quick Create (prominent client creation)

Fineract revolves around **clients**. **Create client** must be obvious from every authenticated screen — similar to shadcn **dashboard-01** `nav-main` **Quick Create** (primary `SidebarMenuButton` at the top of the sidebar, above regular links).

| Rule | Detail |
|------|--------|
| **Placement** | Sidebar: under branding, **above** navigation Find — not in the header (v1). |
| **Visual** | Primary button: `bg-primary text-primary-foreground`, plus icon, full width in sidebar menu. Reference: dashboard-01 `nav-main.tsx`. |
| **Phase 1 label** | **Create client** (not generic “Quick Create” until a multi-entity menu exists). |
| **Phase 1 action** | Open create-client flow: `FormSheet` if ≤7 logical fields (ADR-006), else full page `/clients/create`. |
| **Phase 2** | Optional `DropdownMenu`: Client · Group · Center · Loan · Savings — each item RBAC-gated. |
| **Permission** | Show control only when `clients.create` / `CREATE_CLIENT` (use `Can` / `filterNavStructure` patterns). |
| **Also on list** | Clients list page keeps **New client** in `ListPage` actions — same handler as Quick Create. |

**Implementation (planned):** `QuickCreate` in `components/platform/` — see [ADR-012](adr/012-quick-create-client.md).

**Do not:** copy dashboard-01’s demo Inbox icon button; use Tabler icons; or put a second primary create button in the site header.

## List screens & data tables

Most Fineract screens are **lists** (table + filters + pagination). Use shared composites — do not copy dashboard-01’s monolithic `data-table.tsx` demo.

### When to use

| UI | Use for |
|----|---------|
| **ListPage** + **DataTable** | Standard index screens (clients, offices, loan products, …) |
| **DataTable** only | Embedded tables inside tabs on a detail page |
| Full page without table | Wizards, dashboards, single-record detail |

### Composite stack (planned)

| Composite | Responsibility |
|-----------|----------------|
| `ListPage` | Title, description, `actions` slot, wraps table region |
| `DataTableToolbar` | Search (debounced), filters, column visibility, toolbar actions |
| `DataTable` | TanStack Table + shadcn `Table`; `columns` + `data` |
| `DataTableColumnHeader` | Sortable header UI (server or client sort) |
| `DataTablePagination` | Page size, page navigation, selection summary |
| `DataTableEmpty` / `DataTableSkeleton` | Empty and loading states |
| `RowActions` (optional) | Per-row `DropdownMenu`; permission-gated |
| `StatusBadge` (optional) | Fineract status → `Badge` variant |

**Primitives already installed:** `table`, `checkbox`, `badge`, `dropdown-menu`, `select`, `skeleton`, `input`, `card`. **Dependency:** `@tanstack/react-table` (use from composites only).

### Server-side lists (default)

Fineract list APIs use `offset`, `limit`, and sort/filter query params. Default architecture:

- Page component (Server Component) fetches page of data via BFF.
- Client `DataTable` uses `manualPagination`, `manualSorting`, `manualFiltering`.
- Parent holds `pageIndex`, `pageSize`, `sorting`, `columnFilters` and refetches on change.

Use **client-side** TanStack models only for small local lists (e.g. &lt;200 rows, settings).

### Layout (target)

```text
ListPage
├── Title + description
├── actions: [ New client ]   ← permission-gated
└── bordered / Card region
    ├── DataTableToolbar
    ├── DataTable (sticky header: bg-muted sticky top-0 z-10)
    └── DataTablePagination
```

### Styling borrowed from dashboard-01

- Bordered, rounded table container.
- Sticky table header row.
- Checkbox column + “{n} of {m} selected” footer when bulk selection is enabled.
- Status cells as `Badge`; row actions as `DropdownMenu`.

### Not in the generic table

- Row drag-and-drop (`@dnd-kit`) unless a screen explicitly needs reorder.
- Charts or tabs inside the shared `DataTable` file.
- Tabler icons — use **Lucide** (see `nav-icon.tsx`).

### File layout per feature

```text
app/(platform)/clients/
  page.tsx          # Server: fetch, pass props
  columns.tsx       # "use client" — ColumnDef[]
```

### Pilot

First implementation: **`/clients`** list with server pagination — pairs with **Create client** (Quick Create + list action).

See [ADR-011](adr/011-data-tables-list-screens.md).

## Form presentation matrix

Choose **one** pattern per flow:

| Pattern | Field count | Content | Footer |
|---------|-------------|---------|--------|
| **FormSheet** (default for simple forms) | **1–7** | Real inputs required (not confirm-only) | Cancel + Submit, sticky |
| **Alert dialog** | 0–2 | Confirm / delete / irreversible | Cancel + Confirm |
| **Full page** | **8+** or wizard | Create client, loan product, etc. | Page header actions or stepper |
| **Form dialog** | 3–5, modal context | Rare; blocking modal OK | Same as sheet |

### FormSheet rules

Use a **right-side shadcn Sheet** when:

- The user stays on the current list/detail context.
- There are **at most 7 logical fields** (see counting below).
- The flow needs **input**, not only “Are you sure?”.

Do **not** use FormSheet for:

- Confirm-only actions → `AlertDialog`.
- Large or multi-step flows → full page + `StepperForm`.
- More than 7 logical fields → full page (or split into steps).

**Field counting (logical fields):**

| Counts as 1 | Counts separately |
|-------------|-------------------|
| One combobox (`SelectField`) | Each text input |
| One `DateField` | Each checkbox/switch that is independent |
| One `MoneyField` | Repeatable blocks (each row counts) |

A checkbox group for one decision = 1 field. A dynamic list of charges = N fields → use a page.

**Footer (required):**

- **Cancel** — `variant="outline"`, closes sheet; optionally warn if dirty (later).
- **Submit** — `variant="default"`, primary action; `loading` while submitting; disabled when form invalid.

**Layout:**

```text
┌ Sheet ─────────────────────┐
│ Title                        │
│ Description (optional)       │
├──────────────────────────────┤
│ ▲ scrollable body            │
│   <FormField>…</FormField>   │
├──────────────────────────────┤
│ [ Cancel ]  [ Submit ]       │  ← sticky footer
└──────────────────────────────┘
```

Implementation: `FormSheet` in `apps/web/src/components/composites/form-sheet.tsx`.

## Field composites (planned / in progress)

| Composite | shadcn basis | Notes |
|-----------|--------------|-------|
| `SelectField` | Command + Popover | Default for lookups; autocomplete |
| `DateField` | Calendar + Popover | Fineract date format via `@mifos/domain` |
| `DateTimeField` | Calendar + time | When API needs datetime |
| `MoneyField` | Input | `decimal.js`; never float |
| `TextField` | Input + Label | Via `FormField` wrapper |
| `FormField` | — | Label, error, `aria-*` for RHF |

Use plain shadcn `Select` only for static enums with **≤4** options (e.g. Yes/No).

## Anti-patterns

- Raw `<select>` or shadcn `Select` for offices, clients, products, GL accounts.
- Simple 4-field create forms on a new route when a sheet is enough.
- Submit in the sheet header (actions belong in the footer).
- More than 7 fields crammed into a sheet — use a page.
- Pasting dashboard-01 `data-table.tsx` into the repo as a shared component.
- Wiring `useReactTable` in feature pages instead of `DataTable` composite.
- Hiding **Create client** only on the clients list with no sidebar Quick Create.

## Reference

| ADR | Topic |
|-----|-------|
| [005](adr/005-ui-composites.md) | Composites-only in features |
| [006](adr/006-form-sheet-pattern.md) | FormSheet |
| [010](adr/010-vercel-style-navigation.md) | Sidebar, Find, featured links |
| [011](adr/011-data-tables-list-screens.md) | Data tables & list screens |
| [012](adr/012-quick-create-client.md) | Quick Create / Create client |

## Layout blocks (shadcn)

Installed via `npx shadcn add dashboard-01 login-04` and adapted to Mifos rules (no OAuth, BFF-only auth, nav from `@mifos/routes`).

| Block | Mifos implementation | Notes |
|-------|----------------------|-------|
| **login-04** | `app/(auth)/login/page.tsx` + `components/auth/login-form.tsx` | Split card, `Field`/`Card`; Fineract username/password + remember-me; server banner + Manage servers sheet; demo block only when `DEMO_SESSION_ENABLED`. |
| **dashboard-01** | `components/platform/platform-shell.tsx` | `SidebarProvider` + `SidebarInset`; sidebar, header, Find. **Quick Create** styling reference only — see ADR-012. **Data table** styling reference only — see ADR-011. |

**Do not** re-add stock shadcn scaffold routes (`app/login`, `app/dashboard`) or OAuth/sign-up from the block templates.

Primitives added for these blocks live under `components/ui/` (sidebar, field, card, table, etc.). Feature screens use **composites** for domain UI; platform chrome is the exception for global shell controls.

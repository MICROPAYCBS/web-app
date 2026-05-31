# ADR-011: Data tables and list screens

## Status

Accepted (documentation); composites **not yet implemented**.

## Context

Fineract is list-heavy: clients, loans, savings, offices, products, journal entries, and dozens of admin/config screens. The greenfield app has:

- shadcn `Table` primitive (`components/ui/table.tsx`)
- `@tanstack/react-table` installed but unused in feature code
- No shared list-page or `DataTable` composite

The shadcn **dashboard-01** block includes a large demo `data-table.tsx` (~800 lines) with drag-and-drop rows, tabs, charts in a drawer, and client-side pagination. That file is a **visual reference**, not a drop-in library. The official shadcn [Data Table](https://ui.shadcn.com/docs/components/data-table) guide is the correct base for a thin, reusable wrapper.

Most Fineract APIs use **server-side** `offset`, `limit`, `orderBy`, and filter parameters. List UIs must default to server-driven pagination and sorting, not in-memory models for production datasets.

## Decision

### Layering (ADR-005)

| Piece | Location | Notes |
|-------|----------|--------|
| `Table`, `Checkbox`, `Badge`, … | `components/ui/` | Primitives only |
| `DataTable`, toolbar, pagination, column header | `components/composites/` | Feature code imports these |
| `ListPage` (optional shell) | `components/composites/` | Title, description, primary actions, table card |
| Column defs per screen | `app/(platform)/…/columns.tsx` | Client component; TanStack `ColumnDef` |
| Data fetch | Server Component page or BFF route | Pass `data` + `pageCount` into client table |

Feature routes **must not** wire `useReactTable` directly against raw `components/ui/table` except when authoring a new composite.

### Composites to build (in order)

1. **`DataTable`** — `flexRender` + `Table` primitive; props: `columns`, `data`, optional `rowSelection`, `onRowSelectionChange`, `getRowId`.
2. **`DataTableColumnHeader`** — sortable label + icon; supports manual/server sort when `column.getCanSort()` and `onSortingChange` are owned by parent.
3. **`DataTablePagination`** — rows-per-page `Select`, page index, first/prev/next/last; driven by parent state for server mode.
4. **`DataTableToolbar`** — search input (debounced), optional faceted filters, column visibility `DropdownMenu`, slot for primary/secondary actions.
5. **`DataTableEmpty`** / **`DataTableSkeleton`** — consistent empty and loading rows.
6. **`ListPage`** — page title, optional breadcrumbs, `actions` slot (e.g. Create), children = toolbar + table + pagination inside `Card` or bordered region.

Optional later: **`StatusBadge`** (Fineract status → variant), **`MoneyCell`**, **`DateCell`** (via `@mifos/domain`), **`RowActions`** (permission-gated `DropdownMenu`).

### Patterns borrowed from dashboard-01 (styling only)

- Table inside `overflow-hidden rounded-md border` (or `Card`).
- **Sticky** header: `TableHeader` with `bg-muted sticky top-0 z-10`.
- Toolbar row above table: primary action right, search/filters left.
- Footer: “{n} of {m} row(s) selected” when row selection is enabled.
- Row actions via `DropdownMenu` at end of row.

### Not in the generic DataTable

- Row drag-and-drop reorder (`@dnd-kit`) — only if a specific screen needs it.
- Demo charts inside drawer — not part of the table composite.
- Tabbed “outline / performance” filters inside the table file — per-screen, above toolbar.

### Server vs client mode

| Mode | When | TanStack models |
|------|------|-----------------|
| **Server** (default) | Fineract list APIs | `manualPagination`, `manualSorting`, `manualFiltering`; parent holds `pageIndex`, `pageSize`, `sorting`, `columnFilters` and refetches |
| **Client** | Small static lists (≤ ~200 rows), settings | `getPaginationRowModel`, `getSortedRowModel`, `getFilteredRowModel` |

### List screen anatomy

```text
ListPage
├── header: title + description
├── actions: [Create …] (permission-gated)
└── Card
    ├── DataTableToolbar (search, filters, columns)
    ├── DataTable
    └── DataTablePagination
```

Create flows from a list use **FormSheet** (≤7 fields), **full page** (8+ or wizard), or navigate to a dedicated create route — see ADR-006 and [COMPONENTS.md](../COMPONENTS.md).

### RBAC

- Hide toolbar actions and row menu items when `can(user, permission)` fails.
- Do not rely on hiding alone for security; BFF must enforce permissions on writes.

## Consequences

- First pilot list: **Clients** (`/clients`) with server pagination against BFF `GET /clients`.
- `docs/COMPONENTS.md` is the catalog and review checklist for list UIs.
- dashboard-01 `data-table.tsx` is **not** copied into the repo; only patterns above are extracted.

## References

- [COMPONENTS.md — List screens & data tables](../COMPONENTS.md#list-screens--data-tables)
- [ADR-005](005-ui-composites.md) — composites-only
- [ADR-006](006-form-sheet-pattern.md) — create/edit forms from lists
- shadcn: [Data Table](https://ui.shadcn.com/docs/components/data-table)

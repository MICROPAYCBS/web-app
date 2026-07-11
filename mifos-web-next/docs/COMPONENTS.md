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
| **Placement** | Sidebar: under branding, **below** navigation Find — not in the header (v1). |
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
## Detail pages (read-only key / value)

Client detail, loan account, savings account, and similar screens are **mostly read-only**: grouped **sections** of label/value pairs, with **tabs** for larger surfaces (documents, transactions). Edits use FormSheet or full-page forms (ADR-006) — not inline inputs on the detail view.

### Layering

| Composite | Use |
|-----------|-----|
| `DetailPage` | Page shell: header slot, optional tabs, content area |
| `PageHeader` | Fixed title region; use `pageHeaderPadding` / `pageHeaderContentSpacing` from `@/lib/platform-layout` — do not hand-roll `pt-*` on detail/list/wizard headers |
| `DetailHeader` | Entity name, `StatusBadge`, ids, office/product sublines, actions `DropdownMenu` |
| `DetailSummary` | Optional 2–4 KPI cards (e.g. outstanding balance, arrears) |
| `DetailTabs` | shadcn `Tabs`; sync `?tab=` when deep links matter |
| `DetailSection` | Titled block (`Card`) with description + field grid |
| `DetailField` | One label + value (or custom value slot) |
| `DetailFieldGrid` | Responsive 1→2 column grid of fields |
| `MoneyValue` | Currency + amount via `@mifos/domain` / `Decimal` |
| `DateValue`, `PercentValue`, `CatalogValue` | Typed display + empty state |

Primitives: `Card`, `Tabs`, `Badge`, `Separator`. Tables inside tabs use **DataTable** (see [List screens](#list-screens--data-tables)).

### Hierarchy (how to group information)

Think **outside-in**:

```text
DetailPage
  DetailHeader          ← who/what + status + actions (not a "section")
  DetailSummary?        ← headline money/KPIs only
  DetailTabs
    General tab
      DetailSection     ← e.g. "Account overview"
        DetailFieldGrid
          DetailField
            MoneyValue  ← value slot
```

**Section order — loan / savings account**

1. Status & identifiers (account no, product, currency, office)
2. Balances & summary figures (**money grouped here**)
3. Terms (dates, repayment metadata, rates)
4. Flags / settings (booleans, enums)
5. Audit metadata (muted labels: created, submitted by)

**Section order — client**

1. Header (name, status, id) — `DetailHeader`
2. Personal or entity information
3. Optional performance / summary KPIs
4. Tabs: accounts, charges, documents, notes, …

**Within a section:** keep related fields together; hide optional API fields when absent (do not show empty labels for data Fineract never sent).

### Monetary fields (special attention)

| Rule | Detail |
|------|--------|
| Formatting | `Decimal` + `@mifos/domain` — **never** `toFixed` or raw `number` math |
| Currency | Always show ISO **code** from `currency.code` (e.g. `UGX 1,234.00`) — never `displaySymbol` |
| Alignment | `tabular-nums text-right` for money in grids |
| Zero vs missing | `0.00` vs em dash (—) |
| Rates | `PercentValue` with `%` — do not format as currency |
| Emphasis | Stronger typography only in `DetailSummary`, not every field |

Planned: `formatMoney(amount, currencyCode, locale)` in `@mifos/domain` alongside `formatAmount`.

### Mixed tabs

| Tab content | Pattern |
|-------------|---------|
| Overview, personal data, terms | `DetailSection` + `DetailFieldGrid` |
| Transactions, charges, schedules | `DataTable` (ADR-011) |
| Custom datatables | Dedicated table or single-row grid (per Fineract datatable shape) |

### Legacy parity

Angular uses `data-grid` / `data-item`, `formatNumber`, and `r-amount` right alignment — greenfield composites replace those with one LAF. See `clients-view/personal-data-tab`, `loans-view/account-details`.

### Pilot routes

- `/clients/[clientId]` — header + personal/general sections
- `/loans/[loanId]` (or account id path) — summary strip + terms + balances

See [ADR-013](adr/013-read-only-detail-pages.md).


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
| One `TransactionDateField` | Same as `DateField` (operational posting date) |
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
| `TransactionDateField` | `DateField` or read-only | **Operational posting dates** — business date when configured; see § Business date & transaction dates |
| `DateTimeField` | Calendar + time | When API needs datetime |
| `MoneyField` | Input | `decimal.js`; never float |
| `TextField` | Input + Label | Via `FormField` wrapper |
| `FormField` | — | Label, error, `aria-*` for RHF |

Use plain shadcn `Select` only for static enums with **≤4** options (e.g. Yes/No).

## Business date & transaction dates

When the tenant has **business date** enabled (`enable-business-date` global configuration) and a business date is set, all **transaction and operational posting dates** must follow the organisation business day — not the browser clock.

### Use `TransactionDateField` (not `DateField`)

For any form field that records **when a financial transaction or command is posted**, including but not limited to:

- `transactionDate`, `transferDate`, `closedOnDate`, `activatedOnDate`, `approvedOnDate`
- Journal entry / frequent posting transaction dates
- Savings deposits, withdrawals, holds, transfers, charges (due date when posting)
- Customer lifecycle commands (activate, close, transfer, reject, …)
- Loan **submitted on** (application date)

```tsx
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';

const initialTransactionDate = useInitialTransactionDate();
const [transactionDate, setTransactionDate] = useState(initialTransactionDate);

<TransactionDateField
  label="Transaction date"
  required
  value={transactionDate}
  onChange={setTransactionDate}
  error={fieldErrors.transactionDate}
/>
```

### Behaviour

| Business date | UI | Default value |
|---------------|-----|----------------|
| Enabled **and** set | **Read-only** display + hint “Uses the organisation business date.” | Organisation business date |
| Enabled, set, **not today** | Warning styling (header, `TransactionDateField`, `/system/business-date`) | Organisation business date |
| Disabled or not set | Editable `DateField` (via `TransactionDateField` fallback), capped at today | Today (`useInitialTransactionDate()`) |

### Client vs server defaults

| Layer | API |
|-------|-----|
| Client forms (sheets, dialogs) | `useInitialTransactionDate()` from `BusinessDateProvider` (wired in `PlatformShell`) |
| Server pages (initial form props) | `getDefaultTransactionDate()` from `@/lib/fineract/business-date` |
| Helpers | `getBusinessDateContext()`, `isTransactionDateLocked()`, `resolveTransactionDate()` in `business-date-context.ts` |

Reset form state on open with `initialTransactionDate`, not `dateToFineract(new Date())`.

### Do **not** use `TransactionDateField` for

- **Search and filter** date ranges (journal entry filters, audit trails, list query `fromDate` / `toDate`)
- **Profile and planning** dates: date of birth, incorporation, holidays, expected future disbursement (`allowFuture`)
- **Business date administration** (`/system/business-date` — dates are edited there intentionally)
- Customer onboarding biodata (submitted on may stay `DateField` until explicitly aligned)

New transaction forms **must** follow this pattern. Prefer extending existing sheets rather than introducing new `DateField` + `new Date()` defaults.

## Anti-patterns

- Raw `<select>` or shadcn `Select` for offices, clients, products, GL accounts.
- Simple 4-field create forms on a new route when a sheet is enough.
- Submit in the sheet header (actions belong in the footer).
- More than 7 fields crammed into a sheet — use a page.
- Pasting dashboard-01 `data-table.tsx` into the repo as a shared component.
- Wiring `useReactTable` in feature pages instead of `DataTable` composite.
- Hiding **Create client** only on the clients list with no sidebar Quick Create.
- `DateField` or `dateToFineract(new Date())` for transaction/posting dates — use `TransactionDateField` + `useInitialTransactionDate()` / `getDefaultTransactionDate()`.

## Reference

| ADR | Topic |
|-----|-------|
| [005](adr/005-ui-composites.md) | Composites-only in features |
| [006](adr/006-form-sheet-pattern.md) | FormSheet |
| [010](adr/010-vercel-style-navigation.md) | Sidebar, Find, featured links |
| [011](adr/011-data-tables-list-screens.md) | Data tables & list screens |
| [012](adr/012-quick-create-client.md) | Quick Create / Create client |
| [013](adr/013-read-only-detail-pages.md) | Read-only detail pages (key/value) |

## Layout blocks (shadcn)

Installed via `pnpm exec shadcn add dashboard-01 login-04` and adapted to Mifos rules (no OAuth, BFF-only auth, nav from `@mifos/routes`).

| Block | Mifos implementation | Notes |
|-------|----------------------|-------|
| **login-04** | `app/(auth)/login/page.tsx` + `components/auth/login-form.tsx` | Split card, `Field`/`Card`; Fineract username/password + remember-me; server banner + Manage servers sheet; demo block only when `DEMO_SESSION_ENABLED`. |
| **dashboard-01** | `components/platform/platform-shell.tsx` | `SidebarProvider` + `SidebarInset`; sidebar, header, Find. **Quick Create** styling reference only — see ADR-012. **Data table** styling reference only — see ADR-011. |

**Do not** re-add stock shadcn scaffold routes (`app/login`, `app/dashboard`) or OAuth/sign-up from the block templates.

Primitives added for these blocks live under `components/ui/` (sidebar, field, card, table, etc.). Feature screens use **composites** for domain UI; platform chrome is the exception for global shell controls.

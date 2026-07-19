# ADR-013: Read-only detail pages (key / value)

## Status

Accepted; core detail composites implemented (see `components/composites/detail/`). BFF-backed pages pending.

## Context

Fineract users spend as much time on **detail** screens as on lists: client profile, loan account, savings account, group/center, and admin entity views. These screens are **mostly read-only** key/value layouts, often with:

- Nested **tabs** (general, personal data, documents, transactions, …)
- **Sections** with headings (Personal Information, Loan Terms, Balances)
- **Monetary** fields that need correct formatting, alignment, and currency context
- **Status** and catalog values (enums) that need badges or translated labels
- **Conditional** fields (show only when present in API payload)
- **Actions** in a header menu (separate from read-only body — still RBAC-gated)

The legacy Angular app uses `data-grid` / `data-item` (label + value), `formatNumber` for amounts, `r-amount` right alignment, `mat-card` headers with status icon, and `mat-tab` navigation.

The greenfield app has `@mifos/domain` (`formatAmount`, `Decimal`) but **no detail composites** yet. Write flows are covered by ADR-003 and ADR-006; list flows by ADR-011.

## Decision

### Mental model

```text
DetailPage (layout composite)
├── DetailHeader (entity title, status, identifiers, actions menu)
├── DetailSummary? (optional KPI strip — 2–4 headline figures)
├── DetailTabs? (General | … | Transactions)
│   └── tab panel
│       └── DetailSection × n
│           └── DetailField × n
└── children slots (embedded DataTable, timeline, etc.)
```

**Read-only body** uses **description-list** semantics (`<dl>` or role="group"), not editable inputs. Edits open **FormSheet**, full page, or command dialog — never inline fake inputs on detail pages.

### Layering (ADR-005)

| Piece | Location |
|-------|----------|
| `Card`, `Tabs`, `Badge`, `Separator` | `components/ui/` |
| `DetailPage`, `DetailSection`, `DetailField`, `MoneyValue`, … | `components/composites/` |
| Route-specific section config | `app/(platform)/…/detail-sections.ts` or colocated config |
| Formatting rules | `@mifos/domain` (+ thin display composites) |

Feature routes **must not** hand-roll one-off label/value `<div>` grids; use composites so client and loan details feel identical.

### Composites to build (in order)

1. **`DetailField`** — `label`, `value` slot, `emptyText` (default "—"), optional `hint`. Vertical rhythm: 8px grid.
2. **`DetailFieldGrid`** — responsive grid of fields (1 col mobile, 2 col `md+`; full-width rows for long text).
3. **`DetailSection`** — `title`, optional `description`, `actions` slot; wraps grid in `Card` / `CardHeader` + `CardContent`.
4. **`DetailPage`** — page padding, title slot or breadcrumb, `header` slot, `children`.
5. **`DetailHeader`** — display name, `StatusBadge`, sublines (account no, office, product), `DropdownMenu` for actions.
6. **`MoneyValue`** — amount + currency (see below); used inside `DetailField` value slot.
7. **`DateValue`**, **`PercentValue`**, **`CatalogValue`** (enum label) — consistent null handling.
8. **`DetailSummary`** — horizontal row of compact KPI cards (e.g. outstanding balance, days in arrears).
9. **`DetailTabs`** — shadcn `Tabs` with URL-synced active tab (`?tab=`) where deep-linking matters.

Optional later: **`DetailSidebar`** (client photo, quick links), compliance **`MaskedValue`** wrapper.

### Hierarchy and grouping rules

**Section order (portfolio accounts — loan/savings):**

1. **Status & identifiers** — account no, external id, status, currency, office, product
2. **Summary figures** — balances, arrears, available balance (money-heavy; use `DetailSummary` + `MoneyValue`)
3. **Terms** — dates, repayment schedule metadata, interest rate (mixed types)
4. **Settings / flags** — booleans, enums
5. **Audit / metadata** — submitted on, created by (de-emphasized `text-muted-foreground`)

**Section order (client):**

1. **Header** (not a section) — name, status, client id, office, staff
2. **Personal / entity information**
3. **Performance / summary** (optional KPI)
4. **Related** — tabs for accounts, charges, documents, notes

**Within a section:**

- Label column ~40%, value ~60% on `md+` (legacy `flex-50` pattern).
- Related fields adjacent (e.g. activation date + submitted date).
- **Money fields grouped** in the same section — do not scatter currency amounts across unrelated sections.
- Hide empty optional fields entirely (`@if` / `showWhen` in config), not "—" for Fineract-absent optional data unless the label itself is business-meaningful when empty.

### Monetary and currency display

**Rules (non-negotiable for LAF):**

| Rule | Implementation |
|------|----------------|
| Never use JS `number` arithmetic for display | Parse with `Decimal`; format via `@mifos/domain` |
| Always show **currency context** | `MoneyValue`: `{ amount, currencyCode }` → e.g. `UGX 1,234,567.00` (ISO code, not symbol) |
| Right-align money in grids | `tabular-nums text-right` on value |
| Distinguish **zero** vs **missing** | Zero displays `0.00`; missing displays em dash |
| Tenant vs account currency | Use account/loan `currency.code` from Fineract payload, not guessed |
| Large / sensitive totals | Optional `font-medium` in summary strip only; body fields stay regular weight |
| Percent vs money | `PercentValue` suffix `%`; never format rates as currency |

Extend `@mifos/domain` with `formatMoney(amount, currencyCode, locale?)` when implementing `MoneyValue` — do not duplicate Intl logic in features.

**Anti-patterns:** `toFixed(2)`, concatenating currency strings in pages, left-aligned amounts, mixing money and plain numbers in one column without alignment.

### Status, dates, and catalogs

- **Status** → `StatusBadge` (maps Fineract `status.code` to variant/color).
- **Dates** → `DateValue` using office/tenant date format from `@mifos/domain` (when available); ISO in API only.
- **Catalog enums** → `CatalogValue` (display `value`, not raw `id`).

### Tabs and mixed content

- **Read-only tabs** = `DetailSection` grids only.
- **Table tabs** (transactions, charges) = `DetailTabs` + **DataTable** (ADR-011) inside tab panel — not key/value.
- **Datatable tabs** (custom fields) = separate pattern; may reuse `DetailFieldGrid` for single-row datatable or dedicated table.

### Actions vs read-only

- Destructive / state-changing actions live in **`DetailHeader`** menu or toolbar — not mixed into field grid as buttons per row (except explicit row actions in tables).
- Permission keys per action; hide unavailable commands (ADR-007).

### Routing

- List → detail: `/clients/[id]`, `/loans/[id]`, default tab `general` or first available.
- Breadcrumbs: Portfolio → Clients → {displayName}.
- Registry `parity.webAppRef` documents legacy tab names for migration.

## Consequences

- First pilots: **Client detail** (header + 1–2 tabs of sections) and **Loan account detail** (summary strip + terms + money sections).
- List screens (ADR-011) link rows to detail routes.
- Quick Create (ADR-012) navigates to create flow, not detail — detail is post-create target.
- i18n: labels via translation keys when `@mifos/i18n` is wired; composites accept `label` string from server config initially.

## References

- [COMPONENTS.md — Detail pages](../COMPONENTS.md#detail-pages-read-only-key--value)
- [ADR-005](005-ui-composites.md), [ADR-007](007-rbac.md), [ADR-011](011-data-tables-list-screens.md)
- Legacy reference: `clients-view` (tabs + `data-grid`), `loans-view/account-details` (label/value rows + `formatNumber`)

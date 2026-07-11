# Accounting — parity (mifos-web-next)

Reference for greenfield **Accounting** routes vs legacy Angular (`src/app/accounting/`).

**Purpose:** Track sidebar items under the Accounting nav group. Use checklist IDs (`ACCT-###`) for issues and PRs.

**Registry:** `packages/routes/src/admin-nav-routes.ts` (`acctCoa` … `acctProvisioning`).

---

## Status legend

| Symbol  | Meaning                                       |
| ------- | --------------------------------------------- |
| Done    | Shipped with real page + Fineract wiring      |
| Partial | List or read-only; create/edit/detail missing |
| Planned | Catch-all `ComingSoonPage` only               |
| N/A     | Static / no API                               |

---

## Scorecard (12 routes)

| Done | Partial | Planned |
| ---: | ------: | ------: |
|   12 |       0 |       0 |

---

## Master checklist (nav order)

| ID      | Route                                           | Label                        | Status   | Notes                                      |
| ------- | ----------------------------------------------- | ---------------------------- | -------- | ------------------------------------------ |
| ACCT-010 | `/accounting/chart-of-accounts`                | Chart of accounts            | **Done** | List/tree, create, view, edit GL accounts    |
| ACCT-015 | `/accounting/departments`                      | Departments                  | **Done** | List, create, edit cost centers              |
| ACCT-018 | `/accounting/gl-account-enquiry`               | GL account enquiry           | **Done** | Required GL account search, balances, running balance column |
| ACCT-020 | `/accounting/journal-entries`                   | Journal entries              | **Done** | Search, create, transaction view, reverse  |
| ACCT-022 | `/accounting/journal-entries/central-branch-payment` | Cross-branch | **Done** | Multi-office journal entries via inter-branch clearing (N+1 JEs) |
| ACCT-025 | `/accounting/journal-entries/frequent-postings` | Frequent postings            | **Done** | Shortcut journal form with accounting rules |
| ACCT-030 | `/accounting/financial-activity-mappings`       | Financial activity mappings  | **Done** | List, create, edit via FormSheet           |
| ACCT-040 | `/accounting/migrate-opening-balances`          | Migrate opening balances     | **Done** | Retrieve by office, define balanced entry  |
| ACCT-050 | `/accounting/closing-entries`                   | Closing entries              | **Done** | List, create, view, edit comments, delete  |
| ACCT-060 | `/accounting/accounting-rules`                  | Accounting rules             | **Done** | List, create, view, edit                   |
| ACCT-070 | `/accounting/periodic-accruals`                 | Periodic accruals            | **Done** | Execute accruals till date                 |
| ACCT-080 | `/accounting/provisioning-entries`              | Provisioning entries         | **Done** | List, create, detail, journal, recreate    |

Hub route `/accounting` links to all slices above.

---

## Cross-cutting gaps (all accounting slices)

| Gap                                 | Priority   |
| ----------------------------------- | ---------- |
| `docs/parity/accounting.md` (file)  | Done       |
| i18n (`@ngx-translate` parity)      | Deferred   |
| Unit tests per slice                | Deferred   |

Run `pnpm run routes:parity` for machine-readable counts.

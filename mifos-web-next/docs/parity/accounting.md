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

## Scorecard (9 routes)

| Done | Partial | Planned |
| ---: | ------: | ------: |
|    2 |       0 |       7 |

---

## Master checklist (nav order)

| ID      | Route                                           | Label                        | Status      | Notes                                      |
| ------- | ----------------------------------------------- | ---------------------------- | ----------- | ------------------------------------------ |
| ACCT-010 | `/accounting/chart-of-accounts`                | Chart of accounts            | **Planned** |                                            |
| ACCT-020 | `/accounting/journal-entries`                   | Journal entries              | **Planned** |                                            |
| ACCT-025 | `/accounting/journal-entries/frequent-postings` | Frequent postings            | **Planned** |                                            |
| ACCT-030 | `/accounting/financial-activity-mappings`       | Financial activity mappings  | **Planned** |                                            |
| ACCT-040 | `/accounting/migrate-opening-balances`          | Migrate opening balances     | **Planned** |                                            |
| ACCT-050 | `/accounting/closing-entries`                   | Closing entries              | **Done**    | List, create, view, edit comments, delete  |
| ACCT-060 | `/accounting/accounting-rules`                  | Accounting rules             | **Planned** |                                            |
| ACCT-070 | `/accounting/periodic-accruals`                 | Periodic accruals            | **Planned** |                                            |
| ACCT-080 | `/accounting/provisioning-entries`              | Provisioning entries         | **Done**    | List, create, detail, journal, recreate    |

---

## Wave plan (recommended order)

1. **Provisioning entries** — list, create sheet, detail report, journal entries (`ACCT-080`, done).
2. **Closing entries** — list, create sheet, detail, edit comments, delete (`ACCT-050`, done).
3. **Chart of accounts** — tree/list CRUD (`ACCT-010`).
4. **Journal entries** — search, create, view (`ACCT-020`).
5. **Frequent postings** — shortcut journal form (`ACCT-025`).
6. **Remaining slices** — mappings, migrate balances, rules, accruals.

---

## Cross-cutting gaps (all accounting slices)

| Gap                                 | Priority   |
| ----------------------------------- | ---------- |
| `docs/parity/accounting.md` (file)  | Done       |
| i18n (`@ngx-translate` parity)      | Deferred   |
| Unit tests per slice                | Deferred   |

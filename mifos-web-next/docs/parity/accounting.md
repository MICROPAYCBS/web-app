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
|    4 |       0 |       5 |

---

## Master checklist (nav order)

| ID      | Route                                           | Label                        | Status      | Notes                                      |
| ------- | ----------------------------------------------- | ---------------------------- | ----------- | ------------------------------------------ |
| ACCT-010 | `/accounting/chart-of-accounts`                | Chart of accounts            | **Planned** |                                            |
| ACCT-020 | `/accounting/journal-entries`                   | Journal entries              | **Planned** |                                            |
| ACCT-025 | `/accounting/journal-entries/frequent-postings` | Frequent postings            | **Planned** |                                            |
| ACCT-030 | `/accounting/financial-activity-mappings`       | Financial activity mappings  | **Planned** |                                            |
| ACCT-040 | `/accounting/migrate-opening-balances`          | Migrate opening balances     | **Done**    | Retrieve by office, define balanced entry  |
| ACCT-050 | `/accounting/closing-entries`                   | Closing entries              | **Done**    | List, create, view, edit comments, delete  |
| ACCT-060 | `/accounting/accounting-rules`                  | Accounting rules             | **Planned** |                                            |
| ACCT-070 | `/accounting/periodic-accruals`                 | Periodic accruals            | **Done**    | Execute accruals till date                 |
| ACCT-080 | `/accounting/provisioning-entries`              | Provisioning entries         | **Done**    | List, create, detail, journal, recreate    |

---

## Wave plan (recommended order)

### Shipped (4/9)

1. **Provisioning entries** (`ACCT-080`) — list, create, detail, journal, recreate.
2. **Closing entries** (`ACCT-050`) — list, create, view, edit comments, delete.
3. **Periodic accruals** (`ACCT-070`) — execute till date.
4. **Migrate opening balances** (`ACCT-040`) — retrieve by office, define balanced entry.

### Remaining (5/9)

5. **Chart of accounts** (`ACCT-010`) — tree/list, create, view, edit GL accounts. Foundation for journal entry GL pickers.
6. **Journal entries** (`ACCT-020`) — search, create, transaction view (`/journal-entries/transactions/view/:id`). Unblocks post-submit redirects from opening balances and manual entries.
7. **Frequent postings** (`ACCT-025`) — shortcut journal form; depends on accounting-rules associations.
8. **Financial activity mappings** (`ACCT-030`) — list, create, view, edit.
9. **Accounting rules** (`ACCT-060`) — list, create, view, edit; needed for frequent postings resolver data.

### Open PRs (draft → `dev`)

| PR | Slice | ID |
| --- | --- | --- |
| [#3](https://github.com/MICROPAYCBS/web-app/pull/3) | Provisioning entries | ACCT-080 |
| [#4](https://github.com/MICROPAYCBS/web-app/pull/4) | Closing entries | ACCT-050 |
| [#5](https://github.com/MICROPAYCBS/web-app/pull/5) | Periodic accruals | ACCT-070 |
| [#6](https://github.com/MICROPAYCBS/web-app/pull/6) | Migrate opening balances | ACCT-040 |

---

## Cross-cutting gaps (all accounting slices)

| Gap                                 | Priority   |
| ----------------------------------- | ---------- |
| `docs/parity/accounting.md` (file)  | Done       |
| i18n (`@ngx-translate` parity)      | Deferred   |
| Unit tests per slice                | Deferred   |

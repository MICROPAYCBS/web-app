# System — parity (mifos-web-next)

Reference for greenfield **System** admin routes vs legacy Angular (`src/app/system/`).

**Purpose:** Track all 16 sidebar items under the System nav group. Use checklist IDs (`SYS-###`) for issues and PRs.

**Registry:** `packages/routes/src/admin-nav-routes.ts` (`sysCodes` … `sysAuditTrails`).

---

## Status legend

| Symbol  | Meaning                                       |
| ------- | --------------------------------------------- |
| Done    | Shipped with real page + Fineract wiring      |
| Partial | List or read-only; create/edit/detail missing |
| Planned | Catch-all `ComingSoonPage` only               |
| N/A     | Static / no API                               |

---

## Scorecard (16 routes)

| Done | Partial | Planned |
| ---: | ------: | ------: |
|   14 |       0 |       2 |

---

## Master checklist (nav order)

| ID      | Route                                | Label                 | Status      | Notes                                    |
| ------- | ------------------------------------ | --------------------- | ----------- | ---------------------------------------- |
| SYS-010 | `/system/codes`                      | Codes                 | **Done**    | List, create sheet, detail + values CRUD |
| SYS-020 | `/system/external-events`            | External events       | **Done**    | Toggle configuration table               |
| SYS-030 | `/system/entity-to-entity-mapping`   | Entity mapping        | **Done**    | Filter, create, list                     |
| SYS-040 | `/system/external-services`          | External services     | **Done**    | Hub + S3/SMTP/SMS/notification           |
| SYS-050 | `/system/data-tables`                | Data tables           | **Done**    | List, create, view, edit columns, delete |
| SYS-060 | `/system/hooks`                      | Hooks                 | **Done**    | Full CRUD + events                       |
| SYS-070 | `/system/roles-and-permissions`      | Roles                 | **Done**    | CRUD + permission assignment             |
| SYS-080 | `/system/configure-mc-tasks`         | Maker checker         | **Done**    | Permission toggles                       |
| SYS-090 | `/system/surveys`                    | Surveys               | **Done**    | List, create, view, edit, activate       |
| SYS-100 | `/system/manage-jobs`                | Manage jobs           | Planned     | Scheduler + history + COB tabs           |
| SYS-110 | `/system/configurations`             | Global configurations | **Done**    | Inline edit sheet                        |
| SYS-120 | `/system/account-number-preferences` | Account number prefs  | **Done**    | List, create sheet, view, edit, delete   |
| SYS-130 | `/system/reports`                    | Report configuration  | Planned     | Report CRUD + parameters                 |
| SYS-140 | `/system/system-information`         | System information    | **Done**    | Tenant, versions, server, licensing      |
| SYS-150 | `/system/about-us`                   | About us              | **Done**    | Static mission content                   |
| SYS-160 | `/system/audit-trails`               | Audit trails          | **Done**    | Search, filters, CSV export, detail        |

---

## Wave plan (recommended order)

1. **Close foundation** — codes, data tables (done).
2. **Read-only wins** — system information, about us (done).
3. **Surveys** — list → create/edit/view → activate/deactivate (`SYS-090`, done).
4. **Account number preferences** — medium CRUD slice (`SYS-120`, done).
5. **Audit trails** — search template + paginated list + detail (`SYS-160`, done).
6. **Manage jobs** — largest slice; defer until scheduler APIs are mapped (`SYS-100`).
7. **Report configuration** — overlaps with `/reports` admin route (`SYS-130`).

---

## Cross-cutting gaps (all system slices)

| Gap                                    | Priority   |
| -------------------------------------- | ---------- |
| `docs/parity/system.md` (this file)    | Done       |
| i18n (`@ngx-translate` parity)         | Deferred   |
| Unit tests per slice                   | Deferred   |
| Configuration wizard popovers (legacy) | N/A for v1 |

---

## Related platform progress (context)

| Domain                          | Status              | Doc                      |
| ------------------------------- | ------------------- | ------------------------ |
| Clients                         | In progress         | [clients.md](clients.md) |
| Platform (auth, shell, servers) | In progress         | —                        |
| Organization (19 routes)        | Planned (catch-all) | —                        |
| Accounting (9 routes)           | Planned             | —                        |

Run `pnpm run routes:parity` for machine-readable counts across all domains.

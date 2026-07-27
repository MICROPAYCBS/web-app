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

## Scorecard (18 routes)

| Done | In progress | Planned |
| ---: | ----------: | ------: |
|   17 |           1 |       0 |

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
| SYS-095 | `/system/approval-workflows`         | Approval workflows    | **Done**    | List, create, edit, activate/deactivate  |
| SYS-100 | `/system/manage-jobs`                | Manage jobs           | **Done**    | Scheduler, workflow, COB tabs + detail   |
| SYS-105 | `/system/job-sequences`              | Job sequences         | **In progress** | List, create, edit, execute, run monitor |
| SYS-110 | `/system/configurations`             | Global configurations | **Done**    | Inline edit sheet                        |
| SYS-112 | `/system/two-factor`                 | Two-factor auth       | **Done**    | Delivery + OTP/session settings          |
| SYS-120 | `/system/account-number-preferences` | Account number prefs  | **Done**    | List, create sheet, view, edit, delete   |
| SYS-130 | `/system/reports`                    | Report configuration  | **Done**    | List, create, view, edit, delete, params |
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
6. **Manage jobs** — scheduler, workflow, COB tabs + detail/history (`SYS-100`, done).
6b. **Job sequences** — EOD packs / ordered scheduler+operation runs (`SYS-105`, in progress).
7. **Report configuration** — report CRUD + parameters (`SYS-130`, done).

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

| Domain                          | Status              | Doc                              |
| ------------------------------- | ------------------- | -------------------------------- |
| Clients                         | In progress         | [clients.md](clients.md)         |
| Platform (auth, shell, servers) | In progress         | —                                |
| Organization                    | In progress         | [organization.md](organization.md) |
| Accounting                      | Done (9/9 routes)   | [accounting.md](accounting.md)   |

Run `pnpm run routes:parity` for machine-readable counts across all domains.

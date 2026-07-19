# Parity: Centers

Reference: `openMF/web-app` → `src/app/centers/`

User-facing label for offices: **Branch** (route path unchanged for legacy parity).

## Centers

| Route                         | Method | web-app screen        | Fineract API                                                                            | Schema ID        | E2E | Status |
| ----------------------------- | ------ | --------------------- | --------------------------------------------------------------------------------------- | ---------------- | --- | ------ |
| `/centers`                    | GET    | CentersComponent      | `GET /centers`                                                                          | —                | —   | done   |
| `/centers/create`             | POST   | CreateCenterComponent | `POST /centers`, `GET /centers/template`, `GET /groups`                                 | `centers.create` | —   | done   |
| `/centers/[centerId]/general` | GET    | GeneralTabComponent   | `GET /centers/{id}`, `GET /runreports/GroupSummaryCounts`, `GET /centers/{id}/accounts` | —                | —   | done   |
| `/centers/[centerId]/edit`    | PUT    | EditCenterComponent   | `GET /centers/{id}?template=true`, `PUT /groups/{id}`                                   | `centers.update` | —   | done   |

### Notes

- List supports name and external ID filters, show closed centers, sort, and pagination.
- Create supports optional staff, active/activation date, and attaching groups from the selected branch.
- Detail general tab shows summary counts, groups table, and savings account overview (read-only).
- Center actions (activate, close, meetings, attendance, manage groups), notes, and datatables are not yet migrated.

# Parity: Groups

Reference: `openMF/web-app` → `src/app/groups/`

User-facing label for offices: **Branch** (route path unchanged for legacy parity).

## Groups

| Route                         | Method | web-app screen        | Fineract API                                                         | Schema ID       | E2E | Status |
| ----------------------------- | ------ | --------------------- | -------------------------------------------------------------------- | --------------- | --- | ------ |
| `/groups`                     | GET    | GroupsComponent       | `GET /groups`                                                        | —               | —   | done   |
| `/groups/create`              | POST   | CreateGroupComponent  | `POST /groups`, `GET /groups/template`                               | `groups.create` | —   | done   |
| `/groups/[groupId]/general`   | GET    | GeneralTabComponent   | `GET /groups/{id}`, `GET /runreports/GroupSummaryCounts`, accounts   | —               | —   | done   |
| `/groups/[groupId]/edit`      | PUT    | EditGroupComponent    | `GET /groups/{id}?template=true`, `PUT /groups/{id}`                 | `groups.update` | —   | done   |

### Notes

- List supports name and external ID filters, show closed groups, sort, and pagination.
- Create supports optional staff, active/activation date, and attaching customers from the selected branch.
- Detail general tab shows summary counts, customer members, and loan/savings account overviews (read-only).
- Group actions (activate, close, meetings, attendance, manage members), notes, committee, datatables, and nested loan/savings routes are not yet migrated.

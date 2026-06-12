# Parity: Tasks

Reference: `openMF/web-app` → `src/app/tasks/`

User-facing label for offices in detail views: **Branch** (route path unchanged for legacy parity).

## Checker inbox

| Route                                         | Method          | web-app screen            | Fineract API                                                                          | Schema ID | E2E | Status |
| --------------------------------------------- | --------------- | ------------------------- | ------------------------------------------------------------------------------------- | --------- | --- | ------ |
| `/checker-inbox-and-tasks/checker-inbox`      | GET             | CheckerInboxComponent     | `GET /makercheckers`, `GET /makercheckers/searchtemplate`                             | —         | —   | done   |
| `/checker-inbox-and-tasks/checker-inbox/[id]` | GET/POST/DELETE | ViewCheckerInboxComponent | `GET /audits/{id}`, `POST /makercheckers/{id}?command=`, `DELETE /makercheckers/{id}` | —         | —   | done   |

### Notes

- `/checker-inbox-and-tasks` redirects to the checker inbox list.
- List supports quick filter by user (client-side) and advanced search (date range, action, entity, resource ID).
- Bulk and single approve, reject, and delete with confirmation dialogs.
- Detail view shows command JSON fields and uses `GET /audits/{id}` (legacy parity).
- Other pending-task tabs (client approval, loan approval, etc.) are not yet migrated.

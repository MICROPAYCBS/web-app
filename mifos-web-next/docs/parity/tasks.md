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
- Other pending-task tabs (client approval, loan approval, bulk loan reschedule, etc.) are not yet migrated.
- Loan reschedule create / list / approve / reject is on the loan account **Reschedules** section (`GET/POST /rescheduleloans`).
- Variable installment edits (pending loans only) use **Edit installments** (`POST /loans/{id}/schedule` with `calculateLoanSchedule` / `addVariations` / `deleteVariations`).
- Loan account related-record lists (notes, documents, collateral, guarantors, originators, original schedule, overdue charges, tranches, term variations, delinquency) are sidebar sections on the loan account, not separate App Router pages.
- Loan originators attach only while the loan is **submitted and pending approval** (`POST /loans/{id}/originators/{originatorId}`); detach is the matching `DELETE`. The Originators section stays visible after approval (read-only).

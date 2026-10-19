# Angular inventory — frozen 2026-10-19

openMF/web-app is **not** a living product spec. This file closes leftover Angular-parity items as **keep** (Micropay backlog, Fineract-first) or **drop** (do not implement because Angular had it).

Do not add new Angular-driven rows. New work cites Fineract APIs + Zod manifests + operator docs.

## Keep (Micropay backlog)

Ship when operators need them. Design from Fineract, not from Angular screens.

| Item | Why keep |
|------|----------|
| SYS-105 Job sequences (`/system/job-sequences`) | Already in progress; Micropay job sequencing |
| Standing instruction edit / view + transactions (CL-153, CL-154) | Operators manage recurring transfers after create |
| Client datatable remaining depth (CL-162–CL-165) | Fineract `m_client` datatables, not Angular-specific |
| Office datatable tabs (`m_office`) | Same as client datatables |
| Groups/centers **activate, close, manage members/groups, notes** | Core group-lending lifecycle |
| Compliance name masking (CL-008, CL-028) | Micropay compliance flag |
| KYC export / validation banner (CL-078, CL-079) | Micropay onboarding |
| Savings account statements (CL-067) if still incomplete | Operator/customer statements |

## Drop (not an Angular checklist)

Do not treat these as unfinished product work.

| Item | Why drop |
|------|----------|
| Client `/charges` routes (CL-042, CL-130–CL-135) | Charges live on savings/loan accounts; no client-level charges module |
| Loan application PDF from client loan row (CL-059) | Out of scope; reports stay on the loan/report screens that exist |
| Extra checker-inbox tabs (client approval, loan approval, bulk reschedule) | Checker inbox + loan **Reschedules** already cover the work |
| Groups/centers **meetings and attendance** | Unused in this deployment; re-open only if Fineract meeting APIs are required |
| Collateral table on client **General** (CL-058) | Collateral is the `/collateral` sidebar |
| Angular `/actions/:name` URL parity (CL-171) | Commands already use FormSheet/dialog; legacy paths redirect |
| Client-collateral nested module URL (CL-141) | List + add on `/collateral` is enough |
| Account-list **row quick actions** copied from Angular General (CL-064) | Actions live on the account screens |
| Pixel/column parity with Angular tables (CL-009, CL-065) | Not a product goal |
| `@ngx-translate` i18n parity | App uses `@mifos/i18n` + Fineract codes |
| Hash-route coexistence (`/#/…` redirects) | No shared Angular bookmarks required |

## Archaeology

Domain markdown under this folder and `webAppRef` on existing `APP_ROUTES` entries are historical. Do not require either for new routes.

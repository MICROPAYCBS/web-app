# Parity: Organization

Reference: `openMF/web-app` → `src/app/organization/`

User-facing label for offices: **Branches** (route path unchanged for legacy parity).

## Branches

| Route                                     | Method | web-app screen        | Fineract API        | Schema ID                    | E2E | Status |
| ----------------------------------------- | ------ | --------------------- | ------------------- | ---------------------------- | --- | ------ |
| `/organization/offices`                   | GET    | OfficesComponent      | `GET /offices`      | —                            | —   | done   |
| `/organization/offices?create=1`          | POST   | CreateOfficeComponent | `POST /offices`     | `organization.office.create` | —   | done   |
| `/organization/offices/[officeId]`        | GET    | GeneralTabComponent   | `GET /offices/{id}` | —                            | —   | done   |
| `/organization/offices/[officeId]?edit=1` | PUT    | EditOfficeComponent   | `PUT /offices/{id}` | `organization.office.update` | —   | done   |

## Notes

- List view supports list and tree toggle (legacy parity).
- Create parent picker uses all offices from `GET /offices`.
- Edit parent picker uses `allowedParents` from `GET /offices/{id}?template=true`.
- Office datatable tabs (`m_office`) are not yet implemented in mifos-web-next.

## Provisioning criteria

| Route                                                   | Method | web-app screen                          | Fineract API                        | Schema ID                                   | E2E | Status |
| ------------------------------------------------------- | ------ | --------------------------------------- | ----------------------------------- | ------------------------------------------- | --- | ------ |
| `/organization/provisioning-criteria`                   | GET    | LoanProvisioningCriteriaComponent       | `GET /provisioningcriteria`         | —                                           | —   | done   |
| `/organization/provisioning-criteria/create`            | POST   | CreateLoanProvisioningCriteriaComponent | `POST /provisioningcriteria`        | `organization.provisioning-criteria.create` | —   | done   |
| `/organization/provisioning-criteria/[criteriaId]`      | GET    | ViewLoanProvisioningCriteriaComponent   | `GET /provisioningcriteria/{id}`    | —                                           | —   | done   |
| `/organization/provisioning-criteria/[criteriaId]/edit` | PUT    | EditLoanProvisioningCriteriaComponent   | `PUT /provisioningcriteria/{id}`    | `organization.provisioning-criteria.update` | —   | done   |
| `/organization/provisioning-criteria/[criteriaId]`      | DELETE | ViewLoanProvisioningCriteriaComponent   | `DELETE /provisioningcriteria/{id}` | —                                           | —   | done   |

### Notes

- Create template: `GET /provisioningcriteria/template`.
- Edit template: `GET /provisioningcriteria/{id}?template=true` (merges `loanProducts` + `selectedLoanProducts`).
- Each provisioning category definition is edited via a dialog (min/max age, percentage, liability and expense GL accounts).
- Create requires every category definition to be configured before submit (legacy parity).

## Bulk loan reassignment

| Route                    | Method   | web-app screen                | Fineract API                                                           | Schema ID                                    | E2E | Status |
| ------------------------ | -------- | ----------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | --- | ------ |
| `/organization/bulkloan` | GET/POST | BulkLoanReassignmnetComponent | `GET /loans/loanreassignment/template`, `POST /loans/loanreassignment` | `organization.bulk-loan-reassignment.create` | —   | done   |

### Notes

- Reassign multiple loans from one loan officer to another within a branch.
- Cascading form: branch → assignment date → from/to loan officers → loan checkboxes.
- Loan lists load from officer template (`accountSummaryCollection.clients` and `.groups`).
- Requires `BULKREASSIGN_LOAN` to view and submit.

## Bulk import

| Route                                    | Method   | web-app screen          | Fineract API                                                                                                                 | Schema ID | E2E | Status |
| ---------------------------------------- | -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- | --- | ------ |
| `/organization/bulk-import`              | GET      | BulkImportComponent     | —                                                                                                                            | —         | —   | done   |
| `/organization/bulk-import/[importName]` | GET/POST | ViewBulkImportComponent | `GET /imports`, `GET {urlSuffix}/downloadtemplate`, `POST {urlSuffix}/uploadtemplate`, `GET /imports/downloadOutputTemplate` | —         | —   | done   |

### Notes

- List page shows 17 import types in two columns, each gated by its list permission.
- Detail pages use URL-encoded import names (e.g. `Loan%20Accounts`).
- Template download supports optional branch, staff, and legal form fields per import type.
- Excel upload (`.xls`, `.xlsx`); client imports infer legal form from filename (`person` / `entity`).
- Import history table with refresh; document download requires `READ_DOCUMENT`.
- Binary template and document downloads are proxied via BFF API routes.

## Loan originators

| Route                                                             | Method | web-app screen                | Fineract API                                                   | Schema ID                             | E2E | Status |
| ----------------------------------------------------------------- | ------ | ----------------------------- | -------------------------------------------------------------- | ------------------------------------- | --- | ------ |
| `/organization/manage-loan-originators`                           | GET    | LoanOriginatorsComponent      | `GET /loan-originators`                                        | —                                     | —   | done   |
| `/organization/manage-loan-originators?create=1`                  | POST   | CreateLoanOriginatorComponent | `GET /loan-originators/template`, `POST /loan-originators`     | `organization.loan-originator.create` | —   | done   |
| `/organization/manage-loan-originators/[loanOriginatorId]`        | GET    | ViewLoanOriginatorComponent   | `GET /loan-originators/{id}`                                   | —                                     | —   | done   |
| `/organization/manage-loan-originators/[loanOriginatorId]?edit=1` | PUT    | EditLoanOriginatorComponent   | `GET /loan-originators/template`, `PUT /loan-originators/{id}` | `organization.loan-originator.update` | —   | done   |
| `/organization/manage-loan-originators`                           | DELETE | LoanOriginatorsComponent      | `DELETE /loan-originators/{id}`                                | —                                     | —   | done   |

### Notes

- Full CRUD for loan originators attached to loan accounts.
- Create and edit use `FormSheet` side panels (`?create=1` on list, `?edit=1` on detail). Legacy `/create` and `/[id]/edit` routes redirect.
- List table: ID, name, external ID (copy), status, originator type, channel type, delete action.
- Form fields: name, external ID (create only), status, originator type, channel type.
- Detail view supports edit; delete is available from the list (legacy parity).

## Manage funds

| Route                                           | Method | web-app screen       | Fineract API                         | Schema ID                      | E2E | Status |
| ----------------------------------------------- | ------ | -------------------- | ------------------------------------ | ------------------------------ | --- | ------ |
| `/organization/manage-funds`                    | GET    | ManageFundsComponent | `GET /funds`                         | —                              | —   | done   |
| `/organization/manage-funds?create=1`           | POST   | CreateFundComponent  | `POST /funds`                        | `organization.fund.create`     | —   | done   |
| `/organization/manage-funds/[fundId]`           | GET    | ViewFundComponent    | `GET /funds/{id}`                    | —                              | —   | done   |
| `/organization/manage-funds?edit={id}`          | PUT    | EditFundComponent    | `PUT /funds/{id}`                    | `organization.fund.update`     | —   | done   |

### Notes

- List with filter; row links to detail view.
- Create and edit use `FormSheet` side panels (`?create=1`, `?edit={id}`). Legacy `/create` and `/[fundId]/edit` redirect.
- Fields: name, external ID.

## Password preferences

| Route                                | Method  | web-app screen               | Fineract API                                                    | Schema ID                                  | E2E | Status |
| ------------------------------------ | ------- | ---------------------------- | --------------------------------------------------------------- | ------------------------------------------ | --- | ------ |
| `/organization/password-preferences` | GET/PUT | PasswordPreferencesComponent | `GET /passwordpreferences/template`, `PUT /passwordpreferences` | `organization.password-preferences.update` | —   | done   |

### Notes

- Single settings page to choose the tenant password validation policy (Basic, Standard, Strong).
- Policy options render as selectable cards with Fineract template descriptions.
- Save requires `UPDATE_PASSWORD_VALIDATION_POLICY`; view requires `READ_CONFIGURATION`.

## Currencies

| Route                             | Method | web-app screen            | Fineract API      | Schema ID                      | E2E | Status |
| --------------------------------- | ------ | ------------------------- | ----------------- | ------------------------------ | --- | ------ |
| `/organization/currencies`        | GET    | CurrenciesComponent       | `GET /currencies` | —                              | —   | done   |
| `/organization/currencies/manage` | PUT    | ManageCurrenciesComponent | `PUT /currencies` | `organization.currency.update` | —   | done   |

### Notes

- Not per-currency CRUD — the UI toggles which codes are enabled via bulk `PUT { currencies: ["USD", ...] }`.
- `GET /currencies` returns `selectedCurrencyOptions` (enabled) and `currencyOptions` (master catalog).
- Add/remove on manage page updates immediately (legacy parity); duplicate adds are ignored.

## SMS campaigns

| Route                                           | Method | web-app screen          | Fineract API                                                  | Schema ID                                       | E2E | Status |
| ----------------------------------------------- | ------ | ----------------------- | ------------------------------------------------------------- | ----------------------------------------------- | --- | ------ |
| `/organization/sms-campaigns`                   | GET    | SmsCampaignsComponent   | `GET /smscampaigns`                                           | —                                               | —   | done   |
| `/organization/sms-campaigns/create`            | POST   | CreateCampaignComponent | `POST /smscampaigns`                                          | `organization.sms-campaign.create`              | —   | done   |
| `/organization/sms-campaigns/[campaignId]`      | GET    | ViewCampaignComponent   | `GET /smscampaigns/{id}`                                      | —                                               | —   | done   |
| `/organization/sms-campaigns/[campaignId]/edit` | PUT    | EditCampaignComponent   | `PUT /smscampaigns/{id}`                                      | `organization.sms-campaign.update`              | —   | done   |
| `/organization/sms-campaigns/[campaignId]`      | POST   | ViewCampaignComponent   | `POST /smscampaigns/{id}?command=activate\|close\|reactivate` | `organization.sms-campaign.activate` / `.close` | —   | done   |
| `/organization/sms-campaigns/[campaignId]`      | DELETE | ViewCampaignComponent   | `DELETE /smscampaigns/{id}`                                   | —                                               | —   | done   |
| `/organization/sms-campaigns/[campaignId]`      | GET    | ViewCampaignComponent   | `GET /sms/{id}/messageByStatus`                               | —                                               | —   | done   |

### Notes

- Create template: `GET /smscampaigns/template`.
- Create wizard: campaign (trigger, business rule, report parameters) → message (placeholders from report run) → preview.
- Business rule parameters reuse report parameter metadata (`GET /runreports/FullParameterList`).
- Edit is message-only when campaign is not active (legacy parity).
- Detail view includes SMS status tabs (pending, sent, delivered, failed) with optional date range search.

## Payment types

| Route                                              | Method | web-app screen             | Fineract API                | Schema ID                          | E2E | Status |
| -------------------------------------------------- | ------ | -------------------------- | --------------------------- | ---------------------------------- | --- | ------ |
| `/organization/payment-types`                      | GET    | PaymentTypesComponent      | `GET /paymenttypes`         | —                                  | —   | done   |
| `/organization/payment-types?create=1`             | POST   | CreatePaymentTypeComponent | `POST /paymenttypes`        | `organization.payment-type.create` | —   | done   |
| `/organization/payment-types?edit={paymentTypeId}` | PUT    | EditPaymentTypeComponent   | `PUT /paymenttypes/{id}`    | `organization.payment-type.update` | —   | done   |
| `/organization/payment-types`                      | DELETE | PaymentTypesComponent      | `DELETE /paymenttypes/{id}` | —                                  | —   | done   |

### Notes

- Create and edit use `FormSheet` side panels on the list page (`?create=1`, `?edit={id}`). Legacy `/create` and `/[id]/edit` routes redirect to these query URLs.
- List columns: name, description (hidden by default), code, system defined, cash payment, position, actions (sticky right).
- System-defined types: edit allows name and description only; delete is hidden.
- Custom types: full edit and delete from the list actions column.

## Customer classes

| Route                                                              | Method | web-app screen              | Fineract API                         | Schema ID                               | E2E | Status |
| ------------------------------------------------------------------ | ------ | --------------------------- | ------------------------------------ | --------------------------------------- | --- | ------ |
| `/organization/customer-classes`                                   | GET    | CustomerClassesComponent    | `GET /customerclasses`               | —                                       | —   | done   |
| `/organization/customer-classes?create=1`                        | POST   | CreateCustomerClassComponent | `POST /customerclasses`             | `organization.customer-class.create`    | —   | done   |
| `/organization/customer-classes/[customerClassId]?edit=1`          | PUT    | EditCustomerClassComponent  | `PUT /customerclasses/{id}`          | `organization.customer-class.update`    | —   | done   |
| `/organization/customer-classes`                                   | DELETE | CustomerClassesComponent    | `DELETE /customerclasses/{id}`       | —                                       | —   | done   |

### Notes

- Create and edit use `FormSheet` side panels (`?create=1` on list, `?edit=1` on detail). Legacy `/create` and `/[id]/edit` routes redirect.
- Template: `GET /customerclasses/template`.
- List columns: code, name, legal form, risk level, status, actions.

## Customer titles

| Route                                                    | Method | web-app screen           | Fineract API                  | Schema ID                            | E2E | Status |
| -------------------------------------------------------- | ------ | ------------------------ | ----------------------------- | ------------------------------------ | --- | ------ |
| `/organization/customer-titles`                          | GET    | CustomerTitlesComponent  | `GET /clienttitles`           | —                                    | —   | done   |
| `/organization/customer-titles?create=1`                 | POST   | CreateCustomerTitleComponent | `POST /clienttitles`    | `organization.customer-title.create` | —   | done   |
| `/organization/customer-titles/[customerTitleId]?edit=1` | PUT    | EditCustomerTitleComponent | `PUT /clienttitles/{id}`  | `organization.customer-title.update` | —   | done   |
| `/organization/customer-titles`                          | DELETE | CustomerTitlesComponent  | `DELETE /clienttitles/{id}`   | —                                    | —   | done   |

### Notes

- Legacy `/organization/client-titles` redirects to this list.
- Gender-specific or neutral titles for customer biodata.

## Contact types

| Route                                              | Method | web-app screen          | Fineract API               | Schema ID                          | E2E | Status |
| -------------------------------------------------- | ------ | ----------------------- | -------------------------- | ---------------------------------- | --- | ------ |
| `/organization/contact-types`                      | GET    | ContactTypesComponent   | `GET /contacttypes`        | —                                  | —   | done   |
| `/organization/contact-types?create=1`             | POST   | CreateContactTypeComponent | `POST /contacttypes`  | `organization.contact-type.create` | —   | done   |
| `/organization/contact-types?edit={contactTypeId}` | PUT    | EditContactTypeComponent | `PUT /contacttypes/{id}` | `organization.contact-type.update` | —   | done   |
| `/organization/contact-types`                      | DELETE | ContactTypesComponent   | `DELETE /contacttypes/{id}` | —                               | —   | done   |

### Notes

- Create and edit use `FormSheet` side panels on the list page (`?create=1`, `?edit={id}`).
- Defines channels such as mobile, email, and WhatsApp for customer contact points.

## Tellers

| Route                                       | Method | web-app screen        | Fineract API                 | Schema ID                    | E2E | Status |
| ------------------------------------------- | ------ | --------------------- | ---------------------------- | ---------------------------- | --- | ------ |
| `/organization/tellers`                     | GET    | TellersComponent      | `GET /tellers`               | —                            | —   | done   |
| `/organization/tellers?create=1`            | POST   | CreateTellerComponent | `POST /tellers`              | `organization.teller.create` | —   | done   |
| `/organization/tellers/[tellerId]`          | GET    | ViewTellerComponent   | `GET /tellers/{id}`          | —                            | —   | done   |
| `/organization/tellers/[tellerId]?edit=1`   | PUT    | EditTellerComponent   | `PUT /tellers/{id}`          | `organization.teller.update` | —   | done   |
| `/organization/tellers/[tellerId]`          | DELETE | ViewTellerComponent   | `DELETE /tellers/{id}`       | —                            | —   | done   |
| `/organization/tellers/[tellerId]/cashiers` | GET    | CashiersComponent     | `GET /tellers/{id}/cashiers` | —                            | —   | done   |
| `/organization/tellers/[tellerId]/cashiers` | POST   | CashiersComponent     | `POST /tellers/{id}/cashiers` | `organization.cashier.assign` | —   | done   |
| `/organization/tellers/[tellerId]/cashiers/[cashierId]` | GET    | ViewCashierComponent  | `GET /tellers/{id}/cashiers/{cashierId}/summaryandtransactions` | `organization.cashiers.view` (`READ_MY_CASHIER` or `READ_TELLER`) + staff ownership for self | —   | done   |
| `/organization/tellers/[tellerId]/cashiers/[cashierId]` | PUT    | ViewCashierComponent  | `PUT /tellers/{id}/cashiers/{cashierId}` | `organization.cashier.update` | —   | done   |
| `/organization/tellers/[tellerId]/cashiers/[cashierId]` | DELETE | ViewCashierComponent  | `DELETE /tellers/{id}/cashiers/{cashierId}` | — | —   | done   |
| `/organization/tellers/[tellerId]/cashiers/[cashierId]` | POST   | ViewCashierComponent  | `POST .../allocate`, `POST .../settle` | `organization.cashier.allocate`, `organization.cashier.settle` | — | done |

### Notes

- Create and edit use `FormSheet` side panels (`?create=1` on list, `?edit=1` on detail). Legacy `/create` and `/[id]/edit` routes redirect.
- List columns: branch, teller name (links to detail), status, started on, actions (view cashiers icon, sticky right).
- Edit locks branch assignment (legacy parity).
- Status values: Active (300), Inactive (400).
- Cashiers: assign staff (`FormSheet`), edit/delete from list, detail view with summary and transactions. Cashier status uses the first selected organization currency by default; currency can be switched on the detail page.

## Standing instructions history

| Route                                         | Method | web-app screen                       | Fineract API                                                               | Schema ID | E2E | Status |
| --------------------------------------------- | ------ | ------------------------------------ | -------------------------------------------------------------------------- | --------- | --- | ------ |
| `/organization/standing-instructions-history` | GET    | StandingInstructionsHistoryComponent | `GET /standinginstructions/template`, `GET /standinginstructionrunhistory` | —         | —   | done   |

### Notes

- Organization-wide execution history search (not the client standing-instructions list).
- Search filters: client name, client ID, transfer type, account type, from account ID (when account type selected), from/to dates.
- Results table: from client, from account, to client, to account, execution time, amount, status, error log (tooltip when failed).
- Default view is an **EmptyState** with **Specify parameters**; the search form opens in a floating `FormSheet` sidebar (report-run pattern).
- After search, results render in the main area; **Parameters** in the header reopens the sidebar.

## Fund mapping

| Route                        | Method   | web-app screen       | Fineract API                                   | Schema ID                          | E2E | Status |
| ---------------------------- | -------- | -------------------- | ---------------------------------------------- | ---------------------------------- | --- | ------ |
| `/organization/fund-mapping` | GET/POST | FundMappingComponent | `GET /search/template`, `POST /search/advance` | `organization.fund-mapping.search` | —   | done   |

### Notes

- Advance loan search summary grouped by branch and product (legacy fund mapping screen).
- Default view is an **EmptyState** with **Specify parameters**; the search form opens in a floating sidebar.
- Search filters: loan status, products, branches, date type, from/to dates, outstanding percentage and amount comparisons.
- Results table: branch, product, count, outstanding, percentage.
- Submit label **View summary** (legacy **Summary** button).

## Investors

| Route                     | Method   | web-app screen     | Fineract API                                                                                      | Schema ID                               | E2E | Status |
| ------------------------- | -------- | ------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------- | --- | ------ |
| `/organization/investors` | GET/POST | InvestorsComponent | `POST /external-asset-owners/search`, `POST /external-asset-owners/transfers/{id}?command=cancel` | `organization.investor-transfer.cancel` | —   | done   |

### Notes

- External asset owner transfer search and management (legacy investors screen).
- Loads transfer history on first visit (legacy `ngOnInit` auto-search with empty filters).
- Search filters: text, effective from/to dates, settlement from/to dates (`yyyy-MM-dd` in API payload).
- Results render as expandable cards per transfer (legacy accordion panels).
- Server-side pagination (50/100/200 rows).
- **Parameters** opens a floating sidebar for search filters.
- Pending transfers can be cancelled with confirmation dialog.
- External IDs support copy-to-clipboard.

## Ad hoc query

| Route                                           | Method | web-app screen            | Fineract API                                                 | Schema ID                         | E2E | Status |
| ----------------------------------------------- | ------ | ------------------------- | ------------------------------------------------------------ | --------------------------------- | --- | ------ |
| `/organization/adhoc-query`                     | GET    | AdhocQueryComponent       | `GET /adhocquery`                                            | —                                 | —   | done   |
| `/organization/adhoc-query/create`              | POST   | CreateAdhocQueryComponent | `GET /adhocquery/template`, `POST /adhocquery`               | `organization.adhoc-query.create` | —   | done   |
| `/organization/adhoc-query/[adhocQueryId]`      | GET    | ViewAdhocQueryComponent   | `GET /adhocquery/{id}`                                       | —                                 | —   | done   |
| `/organization/adhoc-query/[adhocQueryId]/edit` | PUT    | EditAdhocQueryComponent   | `GET /adhocquery/{id}?template=true`, `PUT /adhocquery/{id}` | `organization.adhoc-query.update` | —   | done   |

### Notes

- Custom SQL queries that insert results into a target table with optional email delivery.
- List table: name, SQL query, table affected, email, report run frequency, status, created by.
- Client-side filter and pagination on the list view.
- Create/edit form: name, SQL query, insert table, table fields, email, report run frequency (with custom day interval when frequency id is 5), active flag.
- Detail view supports edit and delete with confirmation.

## Holidays

| Route                                     | Method | web-app screen         | Fineract API                                                 | Schema ID                       | E2E | Status |
| ----------------------------------------- | ------ | ---------------------- | ------------------------------------------------------------ | ------------------------------- | --- | ------ |
| `/organization/holidays`                  | GET    | HolidaysComponent      | `GET /holidays?officeId=`, `GET /offices`                    | —                               | —   | done   |
| `/organization/holidays/create`           | POST   | CreateHolidayComponent | `GET /holidays/template`, `POST /holidays`                   | `organization.holiday.create`   | —   | done   |
| `/organization/holidays/[holidayId]`      | GET    | ViewHolidaysComponent  | `GET /holidays/{id}`, `POST /holidays/{id}?command=activate` | `organization.holiday.activate` | —   | done   |
| `/organization/holidays/[holidayId]/edit` | PUT    | EditHolidayComponent   | `PUT /holidays/{id}`                                         | `organization.holiday.update`   | —   | done   |

### Notes

- Branch-scoped holiday list (select a branch to load holidays; deleted holidays excluded).
- List table: name, start date, end date, repayments scheduled to, status.
- Create form: dates, repayment scheduling type (specific date when type id is 2), description, applicable branches.
- Active holidays: edit name and description only (legacy parity).
- Pending holidays: full edit including dates and rescheduling rules.
- Detail view: activate (when not active), edit, delete with confirmation.

## Working days

| Route                        | Method  | web-app screen       | Fineract API                           | Schema ID                          | E2E | Status |
| ---------------------------- | ------- | -------------------- | -------------------------------------- | ---------------------------------- | --- | ------ |
| `/organization/working-days` | GET/PUT | WorkingDaysComponent | `GET /workingdays`, `PUT /workingdays` | `organization.working-days.update` | —   | done   |

### Notes

- Organization-wide settings page (not CRUD list/detail).
- Weekly working days use iCal recurrence (`FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,...`).
- Form fields: working day checkboxes, repayment reschedule type for payments due on non-working days, extend term for daily repayment schedules.
- Save requires `UPDATE_WORKINGDAYS`; view requires `READ_WORKINGDAYS`.

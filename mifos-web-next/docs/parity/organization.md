# Parity: Organization

Reference: `openMF/web-app` → `src/app/organization/`

User-facing label for offices: **Branches** (route path unchanged for legacy parity).

## Branches

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/organization/offices` | GET | OfficesComponent | `GET /offices` | — | — | done |
| `/organization/offices?create=1` | POST | CreateOfficeComponent | `POST /offices` | `organization.office.create` | — | done |
| `/organization/offices/[officeId]` | GET | GeneralTabComponent | `GET /offices/{id}` | — | — | done |
| `/organization/offices/[officeId]?edit=1` | PUT | EditOfficeComponent | `PUT /offices/{id}` | `organization.office.update` | — | done |

## Notes

- List view supports list and tree toggle (legacy parity).
- Create parent picker uses all offices from `GET /offices`.
- Edit parent picker uses `allowedParents` from `GET /offices/{id}?template=true`.
- Office datatable tabs (`m_office`) are not yet implemented in mifos-web-next.

## Provisioning criteria

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/organization/provisioning-criteria` | GET | LoanProvisioningCriteriaComponent | `GET /provisioningcriteria` | — | — | done |
| `/organization/provisioning-criteria/create` | POST | CreateLoanProvisioningCriteriaComponent | `POST /provisioningcriteria` | `organization.provisioning-criteria.create` | — | done |
| `/organization/provisioning-criteria/[criteriaId]` | GET | ViewLoanProvisioningCriteriaComponent | `GET /provisioningcriteria/{id}` | — | — | done |
| `/organization/provisioning-criteria/[criteriaId]/edit` | PUT | EditLoanProvisioningCriteriaComponent | `PUT /provisioningcriteria/{id}` | `organization.provisioning-criteria.update` | — | done |
| `/organization/provisioning-criteria/[criteriaId]` | DELETE | ViewLoanProvisioningCriteriaComponent | `DELETE /provisioningcriteria/{id}` | — | — | done |

### Notes

- Create template: `GET /provisioningcriteria/template`.
- Edit template: `GET /provisioningcriteria/{id}?template=true` (merges `loanProducts` + `selectedLoanProducts`).
- Each provisioning category definition is edited via a dialog (min/max age, percentage, liability and expense GL accounts).
- Create requires every category definition to be configured before submit (legacy parity).

## Currencies

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/organization/currencies` | GET | CurrenciesComponent | `GET /currencies` | — | — | done |
| `/organization/currencies/manage` | PUT | ManageCurrenciesComponent | `PUT /currencies` | `organization.currency.update` | — | done |

### Notes

- Not per-currency CRUD — the UI toggles which codes are enabled via bulk `PUT { currencies: ["USD", ...] }`.
- `GET /currencies` returns `selectedCurrencyOptions` (enabled) and `currencyOptions` (master catalog).
- Add/remove on manage page updates immediately (legacy parity); duplicate adds are ignored.

## SMS campaigns

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/organization/sms-campaigns` | GET | SmsCampaignsComponent | `GET /smscampaigns` | — | — | done |
| `/organization/sms-campaigns/create` | POST | CreateCampaignComponent | `POST /smscampaigns` | `organization.sms-campaign.create` | — | done |
| `/organization/sms-campaigns/[campaignId]` | GET | ViewCampaignComponent | `GET /smscampaigns/{id}` | — | — | done |
| `/organization/sms-campaigns/[campaignId]/edit` | PUT | EditCampaignComponent | `PUT /smscampaigns/{id}` | `organization.sms-campaign.update` | — | done |
| `/organization/sms-campaigns/[campaignId]` | POST | ViewCampaignComponent | `POST /smscampaigns/{id}?command=activate\|close\|reactivate` | `organization.sms-campaign.activate` / `.close` | — | done |
| `/organization/sms-campaigns/[campaignId]` | DELETE | ViewCampaignComponent | `DELETE /smscampaigns/{id}` | — | — | done |
| `/organization/sms-campaigns/[campaignId]` | GET | ViewCampaignComponent | `GET /sms/{id}/messageByStatus` | — | — | done |

### Notes

- Create template: `GET /smscampaigns/template`.
- Create wizard: campaign (trigger, business rule, report parameters) → message (placeholders from report run) → preview.
- Business rule parameters reuse report parameter metadata (`GET /runreports/FullParameterList`).
- Edit is message-only when campaign is not active (legacy parity).
- Detail view includes SMS status tabs (pending, sent, delivered, failed) with optional date range search.

## Payment types

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/organization/payment-types` | GET | PaymentTypesComponent | `GET /paymenttypes` | — | — | done |
| `/organization/payment-types?create=1` | POST | CreatePaymentTypeComponent | `POST /paymenttypes` | `organization.payment-type.create` | — | done |
| `/organization/payment-types?edit={paymentTypeId}` | PUT | EditPaymentTypeComponent | `PUT /paymenttypes/{id}` | `organization.payment-type.update` | — | done |
| `/organization/payment-types` | DELETE | PaymentTypesComponent | `DELETE /paymenttypes/{id}` | — | — | done |

### Notes

- Create and edit use `FormSheet` side panels on the list page (`?create=1`, `?edit={id}`). Legacy `/create` and `/[id]/edit` routes redirect to these query URLs.
- List columns: name, description (hidden by default), code, system defined, cash payment, position, actions (sticky right).
- System-defined types: edit allows name and description only; delete is hidden.
- Custom types: full edit and delete from the list actions column.

## Tellers

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/organization/tellers` | GET | TellersComponent | `GET /tellers` | — | — | done |
| `/organization/tellers?create=1` | POST | CreateTellerComponent | `POST /tellers` | `organization.teller.create` | — | done |
| `/organization/tellers/[tellerId]` | GET | ViewTellerComponent | `GET /tellers/{id}` | — | — | done |
| `/organization/tellers/[tellerId]?edit=1` | PUT | EditTellerComponent | `PUT /tellers/{id}` | `organization.teller.update` | — | done |
| `/organization/tellers/[tellerId]` | DELETE | ViewTellerComponent | `DELETE /tellers/{id}` | — | — | done |
| `/organization/tellers/[tellerId]/cashiers` | GET | CashiersComponent | `GET /tellers/{id}/cashiers` | — | — | done |

### Notes

- Create and edit use `FormSheet` side panels (`?create=1` on list, `?edit=1` on detail). Legacy `/create` and `/[id]/edit` routes redirect.
- List columns: branch, teller name (links to detail), status, started on, actions (view cashiers icon, sticky right).
- Edit locks branch assignment (legacy parity).
- Status values: Active (300), Inactive (400).
- Cashiers list is read-only; create/allocate/settle cashier flows are not yet implemented.

## Standing instructions history

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/organization/standing-instructions-history` | GET | StandingInstructionsHistoryComponent | `GET /standinginstructions/template`, `GET /standinginstructionrunhistory` | — | — | done |

### Notes

- Organization-wide execution history search (not the client standing-instructions list).
- Search filters: client name, client ID, transfer type, account type, from account ID (when account type selected), from/to dates.
- Results table: from client, from account, to client, to account, execution time, amount, status, error log (tooltip when failed).
- UI toggles between the search form and results; **Parameters** returns to the form (legacy parity).

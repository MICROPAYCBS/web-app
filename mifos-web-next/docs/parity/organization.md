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

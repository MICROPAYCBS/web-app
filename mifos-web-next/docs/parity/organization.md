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

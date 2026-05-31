# Parity: Clients

Reference: `openMF/web-app` → `src/app/clients/`

## Routes

| Route | Method | web-app screen | Fineract API | Schema ID | Status |
|-------|--------|----------------|--------------|-----------|--------|
| `/clients` | GET | clients list | `GET /clients` | — | in_progress |
| `/clients?create=1` | — | create (sheet) | `POST /clients` | `clients.create` | in_progress |
| `/clients/[id]` | GET | clients-view | `GET /clients/{id}` | — | in_progress |
| `/clients/[id]` | PUT | edit-client | `PUT /clients/{id}` | — | todo |

## Validation

- Manifest: `packages/validation/manifests/clients.create.json`
- Schema: `packages/validation/src/clients/create-client.schema.ts`

## Greenfield notes

- **Create:** FormSheet (person MVP): office, first/last name, submitted date, active + activation date.
- **List:** TanStack table, server-side pagination via `/api/clients`.
- **Detail:** ADR-013 composites with live Fineract data.
- **Next:** Update client, entity legal form, addresses, family members, delete.

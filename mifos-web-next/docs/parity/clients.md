# Parity: Clients

Reference: `openMF/web-app` → `src/app/clients/`

## Routes

| Route | Method | web-app screen | Fineract API | Schema ID | E2E | Status |
|-------|--------|----------------|--------------|-----------|-----|--------|
| `/clients` | GET | clients list | `GET /clients` | — | — | todo |
| `/clients/create` | POST | create-client stepper | `POST /clients` | `clients.create` | — | todo |
| `/clients/[id]` | GET | clients-view | `GET /clients/{id}` | — | — | todo |

## Validation

- Manifest: `packages/validation/manifests/clients.create.json`
- Schema: `packages/validation/src/clients/create-client.schema.ts`

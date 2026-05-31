# Clients — parity (mifos-web-next)

## Create client

| Area         | Legacy Angular                                       | mifos-web-next                                         |
| ------------ | ---------------------------------------------------- | ------------------------------------------------------ |
| Entry        | `/clients/create` stepper                            | `/clients/create` full-page wizard (ADR-006 exception) |
| Quick Create | Sidebar                                              | `/clients/create`                                      |
| General      | Person + entity, office, staff, savings on create, … | `GeneralStep` — parity fields                          |
| Family       | Optional list + dialog                               | `FamilyStep` + `FamilyMemberDialog`                    |
| Address      | When `isAddressEnabled`                              | `AddressStep` + `AddressDialog` + field config API     |
| Datatables   | Per-table steps by legal form                        | `DatatableStep` per registered table                   |
| Preview      | Summary + submit                                     | `PreviewStep`                                          |
| Validation   | Reactive forms                                       | `@mifos/validation` `createClientSchema`               |
| API          | `POST /clients`                                      | BFF → `createClientAction`                             |

## List / detail

| Area               | Status                                |
| ------------------ | ------------------------------------- |
| List (paginated)   | Done — `ClientsTable` + `listClients` |
| Detail (read-only) | Done — `/clients/[clientId]` with section tabs |
| Update             | Not started                           |
| Delete / close     | Not started                           |

## Verification

1. Sign in with `clients.create` permission.
2. Sidebar **Create client** → `/clients/create`.
3. Complete General (person and entity), optional Family, Address (if enabled), datatables, Preview.
4. Confirm redirect to `/clients/{id}`.

## Client detail tabs

| Tab | Route | Content |
|-----|-------|--------|
| General | `/clients/[id]/general` | Identifiers, personal, contact, dates |
| Loans | `/clients/[id]/loans` | Open loan accounts (`GET /clients/{id}/accounts`) |
| Savings | `/clients/[id]/savings` | Savings deposit type |
| Fixed deposits | `/clients/[id]/fixed-deposits` | Fixed deposit type |
| Many to one | `/clients/[id]/relations` | Multi-row client datatables |

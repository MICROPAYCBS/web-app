# Clients — parity (mifos-web-next)

Reference for greenfield client flows vs legacy Angular (`src/app/clients/`).

**Purpose:** Exhaustive inventory of what exists in legacy, what is built in `mifos-web-next`, and what remains. Use checklist IDs (`CL-###`) for issues and PRs. **No commitment to build order** beyond suggested waves at the end.

**Last aligned with legacy:** `clients-routing.module.ts`, `clients-view.component.*`, `general-tab.component.*` (openMF web-app).

---

## Status legend

| Symbol   | Meaning                                        |
| -------- | ---------------------------------------------- |
| Done     | Shipped in mifos-web-next                      |
| Partial  | Some behaviour or fields only                  |
| Planned  | Documented target, not built                   |
| Deferred | Known gap; depends on another domain module    |
| N/A      | Not in legacy or out of scope for client shell |

---

## Master checklist (exhaustive)

### List & navigation (`/clients`)

| ID     | Feature                                                      | Legacy                     | Greenfield                  | Status                  |
| ------ | ------------------------------------------------------------ | -------------------------- | --------------------------- | ----------------------- |
| CL-001 | Paginated client list                                        | `ClientsComponent`         | `ClientsTable` + `/clients` | Done                    |
| CL-002 | Search (debounced + enter)                                   | Search box                 | Server search (`/v2/clients/search`) | Done                    |
| CL-003 | Sort by column                                               | `matSort`                  | Sortable headers + server sort       | Done                    |
| CL-004 | Show closed clients filter                                   | Checkbox                   | `Show closed clients` + `sqlSearch`  | Done                    |
| CL-005 | Row → detail                                                 | `/clients/:id/general`     | `/clients/:id` → `/general` | Done                    |
| CL-006 | Create client CTA                                            | Toolbar                    | Sidebar + `/clients/create` | Done                    |
| CL-007 | Import clients                                               | Bulk import route          | `/clients/import` guided analyze → create | Done                    |
| CL-008 | Compliance name masking                                      | `complianceHideClientData` | —                           | Planned                 |
| CL-009 | List columns: name, account no., external id, status, office | Table                      | Partial (verify parity)     | Partial                 |

### Create client (`/clients/create`)

| ID     | Feature                                                      | Legacy                       | Greenfield              | Status |
| ------ | ------------------------------------------------------------ | ---------------------------- | ----------------------- | ------ |
| CL-010 | Full-page wizard (ADR-006 exception)                         | Stepper                      | `CreateClientWizard`    | Done   |
| CL-011 | General step (person/entity, office, staff, savings product) | `client-general-step`        | `GeneralStep`           | Done   |
| CL-012 | Family step + dialog                                         | `client-family-members-step` | `FamilyStep`            | Done   |
| CL-013 | Address step (when enabled)                                  | `client-address-step`        | `AddressStep`           | Done   |
| CL-014 | Datatable steps by legal form                                | `client-datatable-step`      | `DatatableStep`         | Done   |
| CL-015 | Preview + submit                                             | `client-preview-step`        | `PreviewStep`           | Done   |
| CL-016 | `@mifos/validation` schema                                   | Reactive forms               | `createClientSchema`    | Done   |
| CL-017 | Clickable wizard steps + invalid rail hints                  | —                            | `FormWizard`            | Done   |
| CL-018 | Sticky wizard footer (Cancel / Prev / Next)                  | —                            | Card scroll + footer    | Done   |
| CL-019 | Post-create redirect to detail                               | —                            | `/clients/{id}/general` | Done   |

### Detail shell (all `/clients/[clientId]/*`)

| ID     | Feature                                                | Legacy             | Greenfield                              | Status  |
| ------ | ------------------------------------------------------ | ------------------ | --------------------------------------- | ------- |
| CL-020 | Vertical sidebar (no group titles)                     | Horizontal tabs    | `DetailNavSidebar`                      | Done    |
| CL-021 | Back to clients                                        | Breadcrumb         | `ClientDetailNav` link                  | Done    |
| CL-022 | Profile image upload / capture / delete                | Avatar buttons     | `ClientProfileAvatar` + BFF image route | Done    |
| CL-023 | View / upload / draw / delete signature                | Link + dialogs     | View link under avatar; upload/draw/delete in actions menu | Done    |
| CL-024 | Header: name, status, office, account no., staff       | Card subtitle      | `ClientDetailTop` meta (dates, type, groups, legal form, staff badge) | Partial |
| CL-025 | Summary KPIs (groups, type, mobile, email, activation) | Card fields        | Header meta + General client information | Partial |
| CL-026 | Actions menu (state + RBAC)                            | `mat-menu`         | Flat menu → sheets / dialogs / confirms      | Partial |
| CL-027 | New account CTAs (per product list)                    | When client active | Toolbar on Loans/Savings/FD/RD/Shares tabs; Shares uses `?create=1` FormSheet | Done (shares); Partial (others) |
| CL-028 | Compliance masking on detail                           | env flag           | —                                       | Planned |

### Sidebar routes (target IA)

| ID     | Label                 | Route                                 | Legacy tab / source           | Status   |
| ------ | --------------------- | ------------------------------------- | ----------------------------- | -------- |
| CL-030 | General               | `/general`                            | Client info + financial summary         | Partial  |
| CL-031 | Personal data         | _(legacy tab)_                        | Covered on **General** — no separate route | Done (N/A route) |
| CL-032 | Address               | `/address`                            | Address                       | **Done** |
| CL-033 | Family members        | `/family-members` (+ add, `:id/edit`) | Family Members                | Done   |
| CL-034 | Identities            | `/identities`                         | Identities                    | Done   |
| CL-035 | Documents             | `/documents`                          | Documents                     | Done   |
| CL-036 | Notes                 | `/notes`                              | Notes                         | Done   |
| CL-037 | Loans                 | `/loans`                              | General → loans + WC loans    | Partial  |
| CL-038 | Savings               | `/savings`                            | General → savings             | Partial  |
| CL-039 | Fixed deposits        | `/fixed-deposits`                     | General → FD                  | Partial (list + create + detail panels + lifecycle, modify, add charge)  |
| CL-040 | Recurring deposits    | `/recurring-deposits`                 | General → RD                  | Partial (list + create + detail panels + lifecycle, cashier deposit/withdrawal, modify, add charge)  |
| CL-041 | Shares                | `/shares`                             | List + FormSheet create; detail at `shares-accounts/:id/general` | Done     |
| CL-042 | Charges               | `/charges` (+ nested)                 | General → upcoming + overview | Planned  |
| CL-043 | Collateral            | `/collateral`                         | List + add (side panel)       | Partial  |
| CL-044 | Standing instructions | `/standing-instructions`              | List + create (sidebar tab)   | Partial  |
| CL-045 | Many to one           | `/relations`                          | Multi-row datatables          | Partial  |
| CL-046 | _(dynamic)_           | `/datatables/[name]`                  | One tab per single-row table  | Partial  |

### General tab content (`CL-030`)

| ID     | Block                                             | Legacy (`general-tab`)      | Greenfield              | Status                   |
| ------ | ------------------------------------------------- | --------------------------- | ----------------------- | ------------------------ |
| CL-050 | Identifiers grid                                  | —                           | `ClientGeneralSections` | Done                     |
| CL-051 | Person / entity names                             | Overlap personal tab        | Names, legal form, entity details, is staff | Done                     |
| CL-052 | Contact (mobile, email)                           | Overlap                     | Header + General        | Done                     |
| CL-052a | Group membership                                 | Personal tab                | General + header meta   | Done                     |
| CL-052b | Account / office / staff / default savings       | Personal tab                | General + header        | Done                     |
| CL-053 | Dates (submitted, activated, DOB, closed)         | Overlap                     | Header `ClientDetailTop` | Done                     |
| CL-054 | Performance history (account-derived KPIs)        | Computed from accounts      | Financial summary (+ last loan amount) | Partial                  |
| CL-055 | Upcoming charges table                            | Pending charges + pay/waive | —                       | N/A (no client charges)  |
| CL-056 | Loan accounts table + closed toggle + row actions | On General                  | Moved to `/loans`       | Partial                  |
| CL-057 | Savings / FD / RD / shares tables                 | On General                  | Split to sidebar routes; shares list Done | Partial                  |
| CL-058 | Collateral table on General                       | On General                  | CL-043 route            | Planned                  |
| CL-059 | Loan application PDF from row                     | Report export               | —                       | Deferred                 |

### Account list tabs (`CL-037`–`CL-041`)

| ID     | Feature                                        | Legacy                             | Target                | Status                       |
| ------ | ---------------------------------------------- | ---------------------------------- | --------------------- | ---------------------------- |
| CL-060 | Data source                                    | `GET /clients/{id}/accounts`       | Same BFF              | Done                         |
| CL-061 | Working capital loans in Loans tab             | `workingCapitalLoanAccounts`       | Merged in Loans tab   | Done                         |
| CL-062 | Open vs closed toggle                          | Per product button                 | `ClientAccountsSection` show closed switch | Done              |
| CL-063 | Row → product detail                           | `loans-accounts/:id/general`, etc. | Shares detail live; savings/loans live; FD/RD may still placeholder | Partial |
| CL-064 | Row quick actions (repay, approve, deposit, …) | Contextual buttons                 | Phase 2 per product   | Deferred                     |
| CL-065 | Column parity per product                      | See tables below                   | `ClientAccountsTable` | Partial                      |
| CL-066 | Currency / `MoneyValue` (ADR-013)              | `formatNumber` + currency pipe     | Domain formatters     | Planned                      |
| CL-067 | Account statements                             | Savings account detail / actions   | **Savings account** (not client actions); replaces legacy client screen reports | Planned |

#### Loan table columns (open)

Account No, Product Type, Loan Product, Original Loan, Loan Balance, Amount Paid, Type (individual/group icon), Actions.

#### Loan table columns (closed)

Account No, Loan Product, Product Type, Original Loan (shows last active date), Loan Balance, Amount Paid, Type, Closed Date, Actions (empty).

#### Savings table columns (open)

Account No, Savings Product, Last Active, Balance, Actions (deposit, withdrawal, approve, undo, activate).

#### Savings table columns (closed)

Account No, Savings Product, Closed Date.

#### Fixed / recurring deposit columns

Same pattern as savings; product label differs; RD uses `recurring-deposits-accounts` routes.

#### Shares table columns (open)

Account No, Share Product, Approved Shares, Pending For Approval Shares, Actions (approve, undo, activate).

#### Shares table columns (closed)

Above + Closed Date.

### Personal data (`CL-031`)

Legacy **Personal Data** tab content is delivered on **General** (`ClientGeneralSections` + header). No duplicate sidebar route.

| ID     | Section / feature                   | Notes                                                         | Status  |
| ------ | ----------------------------------- | ------------------------------------------------------------- | ------- |
| CL-070 | Personal information grid           | first/middle/last, DOB, gender, is staff, legal form          | Done (`/general`) |
| CL-071 | Entity details                      | fullname, constitution, incorporation, business line, remarks | Done (`/general`) |
| CL-072 | Account information                 | account no., external id, office, staff, default savings      | Done (`/general`) |
| CL-073 | Contact information                 | mobile, email (addresses → CL-032)                            | Done (header + general) |
| CL-074 | Classification                      | client type, classification                                   | Done (`/general`) |
| CL-075 | Group membership                    | groups list                                                   | Done (`/general`) |
| CL-076 | Important dates                     | submitted, activated, closed (header + general where shown)   | Done |
| CL-077 | Status section                      | status in header; sub status when API returns it              | Done (header) |
| CL-078 | KYC export / validate documentation | Global config gated                                           | Planned |
| CL-079 | Validation status banner            | When KYC enabled                                              | Planned |

### Address (`CL-032`)

| ID     | Feature                                        | API                           | Status |
| ------ | ---------------------------------------------- | ----------------------------- | ------ |
| CL-080 | List addresses                                 | `GET` client addresses        | Done   |
| CL-081 | Field configuration                            | address field config resolver | Done   |
| CL-082 | Add / edit / toggle active                     | template + POST/PUT           | Done   |
| CL-083 | Reuse `AddressFormSheet` (ADR-006) from create | —                             | Done   |
| CL-084 | List / grid view toggle (persisted)            | `CollectionViewToggle`        | Done   |

### Family (`CL-033`)

| ID     | Feature                             | API                    | Status |
| ------ | ----------------------------------- | ---------------------- | ------ |
| CL-090 | List members                        | `GET …/familymembers`  | Done   |
| CL-091 | Add member                          | `POST` + template      | Done   |
| CL-092 | Edit member                         | `PUT …/{memberId}`     | Done   |
| CL-093 | Delete member                       | `DELETE`               | Done   |
| CL-094 | List / grid view toggle (persisted) | `CollectionViewToggle` | Done   |

### Identities (`CL-034`)

| ID     | Feature                    | Permission                       | Status |
| ------ | -------------------------- | -------------------------------- | ------ |
| CL-100 | List identifiers           | `READ_CLIENTIDENTIFIER`          | Done   |
| CL-101 | Add / edit / delete        | template + documents             | Done   |
| CL-102 | Identifier document upload | `upload-document-dialog` pattern | Done   |

### Documents (`CL-035`)

| ID     | Feature                    | Permission      | Status |
| ------ | -------------------------- | --------------- | ------ |
| CL-110 | List documents             | `READ_DOCUMENT` | Done   |
| CL-111 | Upload / download / delete | —               | Done   |

### Notes (`CL-036`)

| ID     | Feature             | Permission          | Status |
| ------ | ------------------- | ------------------- | ------ |
| CL-120 | List notes          | `READ_CLIENTNOTE`   | Done   |
| CL-121 | Add / edit / delete | `edit-notes-dialog` | Done   |

### Charges (`CL-042`) — deferred

| ID     | Route                           | Purpose                        | Status   |
| ------ | ------------------------------- | ------------------------------ | -------- |
| CL-130 | `/charges`                      | All / overview table           | Deferred |
| CL-131 | `/charges/overview`             | Legacy charges overview        | Deferred |
| CL-132 | `/charges/[chargeId]`           | View charge + transactions     | Deferred |
| CL-133 | `/charges/[chargeId]/pay`       | Pay charge                     | Deferred |
| CL-134 | Pay / waive from General teaser | Row actions                    | Deferred |
| CL-135 | Add charge                      | Actions → `actions/Add Charge` | Deferred |

### Collateral (`CL-043`)

| ID     | Feature                                 | Status                        |
| ------ | --------------------------------------- | ----------------------------- |
| CL-140 | Collateral list on client               | Done (`GET /clients/{id}/collaterals`) |
| CL-141 | Row → `client-collateral/:collateralId` | Deferred (collaterals module) |
| CL-142 | Create via list toolbar                 | Done (FormSheet `?create=1`; `/create` redirects) |

### Standing instructions (`CL-044`)

| ID     | Feature                                         | Legacy route                                         | Status  |
| ------ | ----------------------------------------------- | ---------------------------------------------------- | ------- |
| CL-150 | List + filter                                   | `/standing-instructions`                             | Done |
| CL-151 | Create                                          | Side panel (`?create=1`); `/create` redirects        | Partial (template cascade / dropdown options need verification on live Fineract) |
| CL-152 | Query params: officeId, accountType=fromsavings | Create link uses resolved `fromOfficeId`             | Done |
| CL-153 | Edit standing instruction                       | `edit-standing-instructions`                         | Planned |
| CL-154 | View standing instruction + transactions        | `view-standing-instructions`                         | Planned |

### Datatables (`CL-045`, `CL-046`)

| ID     | Rule                                             | Status                   |
| ------ | ------------------------------------------------ | ------------------------ |
| CL-160 | Registry: `GET /datatables?apptable=m_client`    | Done                     |
| CL-161 | Filter by `entitySubType` vs legal form (shared matching + server checks) | Done                     |
| CL-162 | Single-row → `/datatables/[name]` sidebar link   | Partial                  |
| CL-163 | Multi-row → `/relations` (or per-table later)    | Partial (add/delete rows) |
| CL-164 | Permission `READ_{registeredTableName}` per link | Done                     |
| CL-165 | Edit datatable data (FormSheet / page)           | Partial (single-row CRUD; many-to-one add/edit/delete rows) |

### Edit & commands (outside sidebar)

| ID     | Route            | Purpose                                           | Status  |
| ------ | ---------------- | ------------------------------------------------- | ------- |
| CL-170 | `/edit` → `?edit=1` | Wide edit side panel (`UPDATE_CLIENT`)         | Done                       |
| CL-171 | `/actions/:name` | Lifecycle commands (legacy routes)              | Partial (redirect to general; commands via FormSheet/dialog) |

---

## Actions menu — complete inventory

Header `DropdownMenu` — **flat list with icons**; lifecycle/staff/savings open **FormSheet**, signature **dialog**, delete/unassign **confirm**. Visibility is **status-dependent** unless noted.

### Edit & applications

| Action                 | Route / behaviour                                               | Permission                       | When shown        |
| ---------------------- | --------------------------------------------------------------- | -------------------------------- | ----------------- |
| Edit                   | `/edit`                                                         | `UPDATE_CLIENT`                  | Always in menu    |
| New Loan Account       | `loans-accounts/create`                                         | `CREATE_LOAN`                    | Loans tab toolbar (active client) |
| New Savings Account    | `savings-accounts/create`                                       | `CREATE_SAVINGSACCOUNT`          | Savings tab toolbar               |
| New Share Account      | `shares?create=1` (legacy `shares-accounts/create` redirects) | `CREATE_SHAREACCOUNT`            | Shares tab toolbar                |
| New Recurring Deposit  | `recurring-deposits-accounts/create-recurring-deposits-account` | `CREATE_RECURRINGDEPOSITACCOUNT` | Recurring deposits tab toolbar    |
| New Fixed Deposit      | `fixed-deposits-accounts/create`                                | `CREATE_FIXEDDEPOSITACCOUNT`     | Fixed deposits tab toolbar        |

### Lifecycle (`/actions/:name` unless dialog) — flat menu block after Edit

| Action          | Command / template     | Typical status            |
| --------------- | ---------------------- | ------------------------- |
| Activate        | activate               | Pending                   |
| Close           | close template         | Active                    |
| Withdraw        | withdraw template      | Pending                   |
| Reject          | reject template        | Pending                   |
| Reactivate      | reactivate             | Closed                    |
| Undo Rejection  | undo rejection         | Rejected                  |
| Transfer Client | offices list           | Active (hidden while under transfer) |
| Accept Transfer | transfer proposal date | Transfer in progress      |
| Reject Transfer | transfer proposal date | Transfer in progress      |
| Undo Transfer   | transfer proposal date | Transfer in progress or on hold |
| Transfer on hold panel | General tab + release holds | Transfer on hold (304) |
| Delete          | `DELETE` client        | Pending + `DELETE_CLIENT` |

### Staff (dialog vs route)

| Action            | Behaviour                        | Permission                                              |
| ----------------- | -------------------------------- | ------------------------------------------------------- |
| Assign Staff      | Sheet when no officer assigned   | `ASSIGNSTAFF_CLIENT`                                    |
| Reassign Staff    | Sheet — unassign then assign     | `ASSIGNSTAFF_CLIENT` **and** `UNASSIGNSTAFF_CLIENT`     |

### Other (flat menu, after staff)

| Action                 | Route / behaviour                 | Permission                    |
| ---------------------- | --------------------------------- | ----------------------------- |
| Update default savings | `/actions/Update Default Savings` | `UPDATESAVINGSACCOUNT_CLIENT` |
| Upload signature       | `/actions/Upload Signature`       | `CREATE_CLIENTIMAGE`          |
| Draw signature         | Draw pad dialog                   | `CREATE_CLIENTIMAGE`          |
| Delete signature       | `/actions/Delete Signature`       | `DELETE_CLIENTIMAGE` — **only when** client has `clientSignature` document |

**Removed (greenfield):** Client screen reports — printable templates (`GET /templates`); **statements → CL-067** on savings accounts.

Account applications, collateral, and standing instructions live on **sidebar list tabs**, not this menu.

### Avatar / signature (not in Actions submenu)

| Action         | Behaviour                             | Permission           |
| -------------- | ------------------------------------- | -------------------- |
| Upload Image   | Dialog                                | `CREATE_CLIENTIMAGE` |
| Capture Image  | Dialog                                | `CREATE_CLIENTIMAGE` |
| Delete Image   | Dialog                                | `DELETE_CLIENTIMAGE` |
| View Signature | Dialog (chains upload/draw/delete)    | Attachment: `READ_DOCUMENT`; actions use image perms |

---

## Lifecycle action components (legacy reference)

Each maps to `ClientActionsComponent` + dedicated child under `client-actions/`:

`ActivateClient`, `CloseClient`, `WithdrawClient`, `RejectClient`, `ReactivateClient`, `UndoClientRejection`, `TransferClient`, `AcceptClientTransfer`, `RejectClientTransfer`, `UndoClientTransfer`, `ClientAssignStaff`, `UpdateClientSavingsAccount`, `AddClientCharge`, `AddClientCollateral`, `ViewSurvey`, `TakeSurvey`. (`ClientScreenReports` **out of scope** — see CL-067.)

Resolver prefetch: `ClientActionsResolver` (template, offices, charges, collaterals, reports, staff template, transfer dates, surveys).

---

## Client detail — route map (greenfield target)

```text
/clients/[clientId]/
├── (redirect) → general
├── general
├── address
├── family-members/          (+ add, [memberId]/edit)
├── identities
├── documents
├── notes
├── loans
├── savings
├── fixed-deposits
├── recurring-deposits
├── shares
├── charges/                   (+ overview, [chargeId], pay)
├── collateral
├── standing-instructions/     (+ create)
├── relations
├── datatables/[tableName]
├── edit
└── actions/[actionName]

# Sibling product trees (legacy — not under sidebar content outlet)
├── loans-accounts/…
├── savings-accounts/…
├── fixed-deposits-accounts/…
├── recurring-deposits-accounts/…
├── shares-accounts/…
├── client-collateral/…
└── standing-instructions/…    (also linked from menu)
```

---

## APIs & BFF mapping

| Concern             | Fineract                                    | Legacy resolver / service               |
| ------------------- | ------------------------------------------- | --------------------------------------- |
| Client              | `GET /clients/{id}`                         | `ClientViewResolver`                    |
| Accounts            | `GET /clients/{id}/accounts`                | `ClientAccountsResolver`                |
| Charges (pending)   | `GET …/charges?pendingPayment=true`         | General tab                             |
| Charges (all)       | `GET …/charges`                             | `ClientChargesResolver`                 |
| Charge detail / pay | `GET …/charges/{id}`, pay command           | Charge resolvers                        |
| Summary             | `GET /runreports/ClientSummary?R_clientId=` | `getClientSummary`                      |
| Image               | `GET/POST/DELETE …/images`                  | `getClientProfileImage`, upload, delete |
| Signature           | Documents + image endpoints                 | Signature dialogs                       |
| Datatables registry | `GET /datatables?apptable=m_client`         | `ClientDatatablesResolver`              |
| Datatable row(s)    | `GET /datatables/{name}/{clientId}`         | `ClientDatatableResolver`               |
| Edit template       | `GET /clients/template` + client            | `ClientDataAndTemplateResolver`         |
| Address             | field config + template + addresses         | Address resolvers                       |
| Family              | `/clients/{id}/familymembers`               | Family resolvers                        |
| Identifiers         | `/clients/{id}/identifiers`                 | `ClientIdentitiesResolver`              |
| Documents           | `/clients/{id}/documents`                   | `ClientDocumentsResolver`               |
| Notes               | `/clients/{id}/notes`                       | `ClientNotesResolver`                   |
| Commands            | `POST …?command=`                           | `executeClientCommand`                  |
| Collateral          | Collateral module APIs                      | `ClientCollateralResolver`              |

---

## Greenfield implementation inventory (current branch)

| Area          | Path                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------- |
| List          | `apps/web/src/app/(platform)/clients/page.tsx`, `components/clients/clients-table.tsx`     |
| Create        | `clients/create/page.tsx`, `components/clients/create/*`                                   |
| Detail layout | `clients/[clientId]/layout.tsx`, `client-detail-shell.tsx`                                 |
| Nav           | `client-detail-nav.tsx` (General, accounts, datatables per table)                          |
| Accounts UI   | `client-accounts-section.tsx` (open / closed toggle), `client-accounts-table.tsx`          |
| Top / avatar  | `client-detail-top.tsx`, `client-profile-avatar.tsx`, image dialogs, `api/.../image/route` |
| General       | `general/page.tsx`, `client-general-sections.tsx` (includes legacy personal-data fields)   |
| Accounts      | `loans`, `savings`, `fixed-deposits`, `recurring-deposits`, `shares/page.tsx`; share detail under `shares-accounts/[accountId]/general` |
| Relations     | `relations/page.tsx`, `client-relations-view.tsx`                                      |
| Family        | `family-members/page.tsx`, `client-family-view.tsx`, `family-member-form-sheet.tsx`        |
| Identities    | `identities/page.tsx`, `client-identities-view.tsx`, `client-identifier-form-sheet.tsx`    |
| Documents     | `documents/page.tsx`, `client-documents-view.tsx`, `client-document-form-sheet.tsx`        |
| Notes         | `notes/page.tsx`, `client-notes-view.tsx`                                                  |
| Collateral    | `collateral/page.tsx`, `client-collateral-view.tsx`, `create-client-collateral-sheet.tsx`  |
| Lib           | `lib/fineract/client-accounts.ts`, `client-datatables.ts`, `client-image.ts`, `client-identifiers.ts`, `client-documents.ts`, `client-notes.ts`, `client-collaterals.ts` |

---

## Suggested implementation waves

| Wave            | Scope                                                                            | Checklist IDs (primary)                                |
| --------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **A** (current) | Shell, avatar, sidebar scaffold, General fields, open account lists, many-to-one | CL-020–022, CL-030, CL-037–039, CL-045, CL-060         |
| **B**           | Personal data, Address, Family, closed toggles, MoneyValue, WC loans             | CL-031–033, CL-061–062, CL-066, CL-070–083, CL-090–094 |
| **C**           | Identities, Documents, Notes                                                     | CL-034–036, CL-100–121                                 |
| **D**           | RD, Shares, SI, per-datatable routes                                             | CL-040–041 (shares Done), CL-044, CL-150–152, CL-046, CL-162–165     |
| **E**           | Actions menu + `/edit` + `/actions/*`                                            | CL-026–027, CL-170–171, all action rows                |
| **F**           | Product account deep-links + row actions                                         | CL-063–064, CL-141; share account module Done; FD/RD remaining      |

---

## Verification (current)

1. Sign in with `clients.create` (or equivalent) permission.
2. **Create client** → wizard completes → lands on `/clients/{id}/general`.
3. Sidebar: General, Loans, Savings, Fixed deposits, Many to one — each loads.
4. Top: Back link; avatar upload / capture / delete when permitted.
5. Actions menu: sheets/dialogs for commands; Edit → wide side panel (`?edit=1`); delete signature only if `clientSignature` doc exists.

---

## Related docs

- [ADR-013: Read-only detail pages](../adr/013-read-only-detail-pages.md)
- [COMPONENTS.md — Detail pages](../COMPONENTS.md#detail-pages-read-only-key--value)
- [ADR-006: Form sheet pattern](../adr/006-form-sheet-pattern.md)
- Legacy: `src/app/clients/clients-view/`, `general-tab/`, `clients-routing.module.ts`

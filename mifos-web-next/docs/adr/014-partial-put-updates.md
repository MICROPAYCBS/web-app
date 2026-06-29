# ADR-014: Partial PUT updates (clean audit trail)

## Status

Accepted

## Context

Fineract `PUT` endpoints treat request bodies as **partial updates**: omitted keys are left unchanged. Sending the full form on every save creates noisy audit entries and risks re-validating fields the user never touched (for example activation date on an unrelated customer edit).

Customer edit already diffs against an `initial` snapshot before calling Fineract.

## Decision

1. **One diff function per resource** drives:
   - the Fineract PUT body (`diffUpdate*Payload` / `buildUpdate*Payload`)
   - form dirty state (`hasUpdate*Changes`)
   - empty-submit guards (`EmptyUpdatePayloadError`)

2. **Shared comparators** live in `@mifos/validation` (`partial-update.ts`): optional string/id equality, boolean equality, `EmptyUpdatePayloadError`.

3. **Server actions** accept `initialSnapshot` loaded when the edit form opens; the BFF builds the PUT body from `(current, initial)` only.

4. **Form sheets** disable Save until `hasUpdate*Changes` is true (create flows excepted).

5. **Clears** are explicit: when an optional field goes from a value to empty, send `null` or `""` as Fineract expects for that field.

6. **Dates**: include `dateFormat` / `locale` only when a date field is present in the diff.

7. **Lifecycle commands** (`POST ?command=activate`, etc.) stay separate — not covered by this ADR.

## Rollout order

| Phase | Scope |
|-------|--------|
| Done | Customer edit |
| 1 | Customer class, customer title, contact type, identity type |
| 2 | Groups, centers |
| 3 | Client sub-resources (addresses, contacts, income, family, compliance) |
| 4 | Remaining org/system PUT surfaces |

## Consequences

- Audit trails show only fields the user changed.
- Edit forms need `initialForm` state alongside `form`.
- Each resource needs unit tests for diff builders.
- See `apps/web/src/lib/fineract/build-update-client-payload.ts` and `packages/validation/src/organization/customer-class.schema.ts` as reference implementations.

## Backend follow-up (Fineract)

**Todo:** Update `ClientDataValidator.validateForUpdate` so Micropay extension fields count toward `atLeastOneParameterPassedForUpdate` (same as the write service already applies them). Affected parameters include at least:

- `maritalStatusId`
- `titleId`
- `customerClassId`
- `subIndustryId`
- `nationalityCountryId`
- `customerRiskProfileId`
- `emailAddress`

Until that lands, customer edit uses a frontend workaround (`attachFineractClientUpdateValidatorAnchor` in `build-update-client-payload.ts`): when the diff contains only validator-unrecognized keys, the PUT body also includes unchanged `legalFormId` and name fields so validation passes. The write service’s `isChangeIn*` checks keep those out of the audit trail. **Remove the anchor once Fineract is fixed.**

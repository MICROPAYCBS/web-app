# ADR-015: Browser session drafts for long wizards

## Status

Accepted

## Context

Create customer and loan application wizards take minutes to complete. Answers lived only in React state. A refresh, Cancel, or a failed lookup that forced the teller to leave wiped the form.

Fineract has a real **Save draft** only for customers (`POST /clients` with activation omitted). Loan applications and product wizards have no CBS draft entity. Auto-posting customer drafts on every keystroke would create junk records.

Branch PCs are often shared, so `localStorage` / IndexedDB is a poor place for customer PII and KYC images.

## Decision

1. **Session restore** for long create wizards uses **`sessionStorage`**, keyed by user, wizard id, and entity (`mifos.wizard-draft.v1:{userId}:{wizardId}:{entityKey}`).
2. Snapshots are JSON only. **Never persist KYC photo/signature** (or other blobs). Bump `schemaVersion` when the draft shape changes; mismatch discards the snapshot.
3. Do **not** auto-apply a snapshot. Show **Resume** / **Discard**. Writes stay paused until the teller chooses (or starts a new form).
4. Successful submit (and customer **Save draft**) clears the snapshot. Cancel leaves it so they can come back in the same tab.
5. Lookups that fail must be **retryable** in place. Do not treat an empty option list as a validation error, and do not prune filled fields on a failed refresh.
6. First consumers were create customer and create loan application. Remaining `FormWizard` screens (product, charge, user, report, approval, SMS, bulk journal) use the same hook, including **edit** keyed by resource id so an in-progress edit can be resumed after refresh. Loan application **edit** is the exception: restoring a stale session draft over a CBS loan record is unsafe.

## Consequences

- Refresh and in-tab navigation no longer wipe FormWizard answers (create, and edit keyed by id).
- Closing the tab still clears the draft (acceptable on shared PCs).
- Photos still require in-memory capture or Fineract **Save draft**. Passwords are never written to `sessionStorage`.
- Failed charge-option and staff lookups stay retryable and must not prune filled fields.

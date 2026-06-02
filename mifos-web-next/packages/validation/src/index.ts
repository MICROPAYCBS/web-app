/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from './clients/legal-form';
export {
  clientAddressEntrySchema,
  clientNonPersonDetailsSchema,
  createClientSchema,
  createClientSheetSchema,
  datatablePayloadSchema,
  familyMemberSchema,
  type ClientAddressEntry,
  type CreateClientInput,
  type CreateClientPayload,
  type FamilyMemberInput
} from './clients/create-client.schema';
export { mapFineractErrors, type FieldError, type MappedFineractErrors } from './map-fineract-errors';
export {
  formatActionErrorMessage,
  toFineractActionError,
  type FineractActionError
} from './to-fineract-action-error';

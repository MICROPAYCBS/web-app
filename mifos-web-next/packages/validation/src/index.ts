/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export {
  createClientSchema,
  type CreateClientInput,
  type CreateClientPayload
} from './clients/create-client.schema';
export { mapFineractErrors, type FieldError, type MappedFineractErrors } from './map-fineract-errors';

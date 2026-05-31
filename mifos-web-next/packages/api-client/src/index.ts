/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export { FineractClient, FineractHttpError } from './fineract-client';
export type { FineractApiError, FineractClientConfig } from './types';

export type {
  FineractAddressFieldConfig,
  FineractClientAddress,
  FineractClientAddressTemplate,
  FineractClientFamilyMember,
  FineractClientDatatableTemplate,
  FineractClientDetail,
  FineractClientSummary,
  FineractClientsPage,
  FineractClientTemplate,
  FineractCreateClientResponse,
  FineractDatatableColumnHeader,
  FineractEnumOption,
  FineractFamilyMemberOptions,
  FineractOfficeOption,
  FineractStaffOption
} from './clients/types';

export type {
  FineractClientAccountStatus,
  FineractClientAccounts,
  FineractClientLoanAccount,
  FineractClientSavingsAccount,
  FineractCurrencyOption,
  FineractDatatableRegistration
} from './clients/accounts-types';

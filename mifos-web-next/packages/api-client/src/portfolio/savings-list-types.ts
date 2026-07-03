/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractClientAccountStatus,
  FineractCurrencyOption
} from '../clients/accounts-types';
import type { FineractEnumOption } from '../clients/types';

export interface SavingsAccountListItem {
  id: number;
  accountNo: string;
  clientId?: number;
  clientName?: string;
  productName?: string;
  status?: FineractClientAccountStatus;
  currency?: FineractCurrencyOption;
  accountBalance?: number;
  depositType?: FineractEnumOption;
  officeName?: string;
}

export interface SavingsAccountsPage {
  pageItems: SavingsAccountListItem[];
  totalFilteredRecords: number;
}

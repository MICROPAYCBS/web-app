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

export interface LoanListItem {
  id: number;
  accountNo: string;
  clientId?: number;
  clientName?: string;
  productName?: string;
  status?: FineractClientAccountStatus;
  currency?: FineractCurrencyOption;
  loanBalance?: number;
  inArrears?: boolean;
  officeName?: string;
}

export interface LoansPage {
  pageItems: LoanListItem[];
  totalFilteredRecords: number;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Row from GET /savingsaccounts/{savingsId}/onholdtransactions */
export interface FineractSavingsOnHoldTransaction {
  id: number;
  savingsId?: number;
  amount?: number;
  transactionDate?: number[] | string;
  reasonForBlock?: string;
  savingsClientName?: string;
  currency?: { code?: string; displaySymbol?: string };
}

export interface FineractSavingsOnHoldTransactionsPage {
  totalFilteredRecords?: number;
  pageItems?: FineractSavingsOnHoldTransaction[];
}

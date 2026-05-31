/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from './types';

/** Status object on loan/savings accounts from GET /clients/{id}/accounts */
export interface FineractClientAccountStatus {
  id?: number;
  code?: string;
  value?: string;
  active?: boolean;
  submittedAndPendingApproval?: boolean;
  pendingApproval?: boolean;
  overpaid?: boolean;
}

export interface FineractCurrencyOption {
  code?: string;
  name?: string;
  decimalPlaces?: number;
}

export interface FineractClientLoanAccount {
  id: number;
  accountNo: string;
  productName?: string;
  productType?: string;
  status: FineractClientAccountStatus;
  currency?: FineractCurrencyOption;
  loanBalance?: number;
  originalLoan?: number;
  amountPaid?: number;
  inArrears?: boolean;
  loanType?: FineractEnumOption;
}

export interface FineractClientSavingsAccount {
  id: number;
  accountNo: string;
  productName?: string;
  status: FineractClientAccountStatus;
  depositType?: FineractEnumOption;
  currency?: FineractCurrencyOption;
  accountBalance?: number;
  lastActiveTransactionDate?: number[] | string;
  timeline?: {
    closedOnDate?: number[];
  };
}

export interface FineractClientAccounts {
  loanAccounts?: FineractClientLoanAccount[];
  savingsAccounts?: FineractClientSavingsAccount[];
  shareAccounts?: unknown[];
  workingCapitalLoanAccounts?: FineractClientLoanAccount[];
  guarantorAccounts?: unknown[];
}

export interface FineractDatatableRegistration {
  applicationTableName?: string;
  registeredTableName: string;
  entitySubType?: string;
  subentityType?: string;
}

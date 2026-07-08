/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from './types';

export interface LoanSchedulePeriod {
  period?: number;
  fromDate?: string;
  dueDate?: string;
  daysInPeriod?: number;
  principalDisbursed?: number;
  principalDue?: number;
  interestDue?: number;
  feeChargesDue?: number;
  penaltyChargesDue?: number;
  principalOutstanding?: number;
  interestOutstanding?: number;
  feeChargesOutstanding?: number;
  penaltyChargesOutstanding?: number;
  totalDueForPeriod?: number;
  totalInstallmentAmountForPeriod?: number;
  totalOutstandingForPeriod?: number;
  totalOverdue?: number;
  principalLoanBalanceOutstanding?: number;
  complete?: boolean;
  downPaymentPeriod?: boolean;
}

export interface LoanScheduleData {
  currency?: FineractCurrencyOption & {
    displaySymbol?: string;
    displayLabel?: string;
  };
  loanTermInDays?: number;
  totalPrincipalDisbursed?: number;
  totalPrincipalExpected?: number;
  totalInterestCharged?: number;
  totalFeeChargesCharged?: number;
  totalPenaltyChargesCharged?: number;
  totalRepaymentExpected?: number;
  periods?: LoanSchedulePeriod[];
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanSchedulePeriod } from '@mifos/api-client';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { loanAccountCurrencyCode } from '@/lib/fineract/loan-account-display';

export type LoanRescheduleInstallmentOption = {
  dueDate: string;
  period?: number;
  principalDue?: number;
  interestDue?: number;
  label: string;
  description?: string;
};

export function unpaidLoanRescheduleInstallments(
  account: FineractLoanAccountDetail
): LoanRescheduleInstallmentOption[] {
  const currencyCode = loanAccountCurrencyCode(account);
  const periods = account.repaymentSchedule?.periods ?? [];
  return periods
    .filter((period): period is LoanSchedulePeriod & { dueDate: string } => {
      return (
        period.period != null &&
        period.period > 0 &&
        period.complete !== true &&
        Boolean(period.dueDate)
      );
    })
    .map((period) => ({
      dueDate: period.dueDate as string,
      period: period.period,
      principalDue: period.principalDue,
      interestDue: period.interestDue,
      label: `Due ${period.dueDate}`,
      description: [
        period.principalDue != null
          ? `Principal ${formatAccountMoney(period.principalDue, currencyCode)}`
          : null,
        period.interestDue != null
          ? `Interest ${formatAccountMoney(period.interestDue, currencyCode)}`
          : null
      ]
        .filter(Boolean)
        .join(' · ')
    }));
}

export function loanRescheduleStatusLabel(status?: {
  value?: string;
  pendingApproval?: boolean;
  approved?: boolean;
  rejected?: boolean;
}): string {
  if (status?.pendingApproval) {
    return 'Pending approval';
  }
  if (status?.approved) {
    return 'Approved';
  }
  if (status?.rejected) {
    return 'Rejected';
  }
  return status?.value?.trim() || 'Unknown';
}

export function loanRescheduleStatusVariant(
  status?: { pendingApproval?: boolean; approved?: boolean; rejected?: boolean }
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status?.approved) {
    return 'default';
  }
  if (status?.rejected) {
    return 'destructive';
  }
  if (status?.pendingApproval) {
    return 'secondary';
  }
  return 'outline';
}

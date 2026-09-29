/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { formatFineractDateValue } from '@/lib/fineract/dates';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { loanAccountCurrencyCode } from '@/lib/fineract/loan-account-display';
import { toFineractFormDate } from '@/lib/fineract/loan-variable-installments-display';

export type LoanRescheduleInstallmentOption = {
  dueDate: string;
  period?: number;
  principalDue?: number;
  interestDue?: number;
  label: string;
  description?: string;
};

/**
 * Schedule rows store a display date (`Aug 1, 2026`). Reschedule commands need `dd MMMM yyyy`.
 * Also accepts a label that still has a leading "Due ".
 */
export function loanRescheduleCommandDate(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/^due\s+/i, '');
  if (!trimmed) {
    return undefined;
  }
  return toFineractFormDate(trimmed);
}

export function unpaidLoanRescheduleInstallments(
  account: FineractLoanAccountDetail
): LoanRescheduleInstallmentOption[] {
  const currencyCode = loanAccountCurrencyCode(account);
  const periods = account.repaymentSchedule?.periods ?? [];
  return periods.flatMap((period) => {
    if (period.period == null || period.period <= 0 || period.complete === true) {
      return [];
    }
    const dueDate = loanRescheduleCommandDate(period.dueDate);
    if (!dueDate) {
      return [];
    }
    const displayDate = formatFineractDateValue(dueDate) ?? dueDate;
    return [
      {
        dueDate,
        period: period.period,
        principalDue: period.principalDue,
        interestDue: period.interestDue,
        label: `Due ${displayDate}`,
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
      }
    ];
  });
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

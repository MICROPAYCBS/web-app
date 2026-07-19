/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanSchedulePeriod } from '@mifos/api-client';
import { parseFineractDateString } from '@/lib/fineract/dates';

export type LoanScheduleComponentKey = 'principal' | 'interest' | 'fees' | 'installment';

export type LoanSchedulePeriodOverdueFlags = {
  period: boolean;
  principal: boolean;
  interest: boolean;
  fees: boolean;
  installment: boolean;
};

function hasPositiveAmount(value: number | undefined): boolean {
  return (value ?? 0) > 0;
}

function isFineractDateBefore(dueDate: string, referenceDate: string): boolean {
  const due = parseFineractDateString(dueDate);
  const reference = parseFineractDateString(referenceDate);
  if (!due || !reference) {
    return false;
  }
  return due.getTime() < reference.getTime();
}

function componentOutstanding(
  period: LoanSchedulePeriod,
  component: LoanScheduleComponentKey
): number | undefined {
  switch (component) {
    case 'principal':
      return period.principalOutstanding;
    case 'interest':
      return period.interestOutstanding;
    case 'fees':
      return period.feeChargesOutstanding;
    case 'installment':
      return period.totalOutstandingForPeriod;
  }
}

function componentDueAmount(
  period: LoanSchedulePeriod,
  component: LoanScheduleComponentKey
): number | undefined {
  switch (component) {
    case 'principal':
      return period.principalDue;
    case 'interest':
      return period.interestDue;
    case 'fees':
      return period.feeChargesDue;
    case 'installment':
      return period.totalDueForPeriod ?? period.totalInstallmentAmountForPeriod;
  }
}

function hasSchedulePaymentDetail(period: LoanSchedulePeriod): boolean {
  return (
    period.complete != null ||
    period.totalOverdue != null ||
    period.totalOutstandingForPeriod != null ||
    period.principalOutstanding != null ||
    period.interestOutstanding != null ||
    period.feeChargesOutstanding != null
  );
}

/** True when a schedule period still has overdue obligations. */
export function isLoanSchedulePeriodOverdue(
  period: LoanSchedulePeriod,
  referenceDate?: string
): boolean {
  if (period.complete === true) {
    return false;
  }

  if (period.totalOverdue != null) {
    return period.totalOverdue > 0;
  }

  if (!hasSchedulePaymentDetail(period)) {
    return false;
  }

  if (!period.dueDate || !referenceDate) {
    return false;
  }

  if (!isFineractDateBefore(period.dueDate, referenceDate)) {
    return false;
  }

  if (period.totalOutstandingForPeriod != null) {
    return period.totalOutstandingForPeriod > 0;
  }

  return false;
}

function isLoanScheduleComponentOverdue(
  period: LoanSchedulePeriod,
  component: LoanScheduleComponentKey,
  referenceDate?: string
): boolean {
  if (!isLoanSchedulePeriodOverdue(period, referenceDate)) {
    return false;
  }

  const outstanding = componentOutstanding(period, component);
  if (outstanding != null) {
    return outstanding > 0;
  }

  // When only aggregate overdue is available, emphasize the installment total.
  if (period.totalOverdue != null && period.totalOverdue > 0) {
    return component === 'installment';
  }

  if (!hasSchedulePaymentDetail(period)) {
    return false;
  }

  return hasPositiveAmount(componentDueAmount(period, component));
}

/** Per-period overdue flags for row and component styling. */
export function loanSchedulePeriodOverdueFlags(
  period: LoanSchedulePeriod,
  referenceDate?: string
): LoanSchedulePeriodOverdueFlags {
  const periodOverdue = isLoanSchedulePeriodOverdue(period, referenceDate);

  return {
    period: periodOverdue,
    principal: isLoanScheduleComponentOverdue(period, 'principal', referenceDate),
    interest: isLoanScheduleComponentOverdue(period, 'interest', referenceDate),
    fees: isLoanScheduleComponentOverdue(period, 'fees', referenceDate),
    installment: isLoanScheduleComponentOverdue(period, 'installment', referenceDate)
  };
}

export function loanScheduleHasOverduePeriods(
  periods: LoanSchedulePeriod[],
  referenceDate?: string
): boolean {
  return periods.some((period) => isLoanSchedulePeriodOverdue(period, referenceDate));
}

/** Sum overdue amounts across schedule periods. */
export function loanScheduleTotalOverdueAmount(
  periods: LoanSchedulePeriod[],
  referenceDate?: string
): number {
  return periods.reduce((total, period) => {
    if (!isLoanSchedulePeriodOverdue(period, referenceDate)) {
      return total;
    }

    if (period.totalOverdue != null) {
      return total + period.totalOverdue;
    }

    if (period.totalOutstandingForPeriod != null) {
      return total + period.totalOutstandingForPeriod;
    }

    return total;
  }, 0);
}

/** Count schedule periods with overdue obligations. */
export function loanScheduleOverdueInstallmentCount(
  periods: LoanSchedulePeriod[],
  referenceDate?: string
): number {
  return periods.filter((period) => isLoanSchedulePeriodOverdue(period, referenceDate)).length;
}

/** Subtle emphasis for overdue schedule rows and amounts. */
export function loanScheduleOverdueRowClassName(overdue: boolean): string | undefined {
  return overdue ? 'border-l-2 border-l-destructive/35 bg-destructive/[0.03]' : undefined;
}

export function loanScheduleOverdueAmountClassName(overdue: boolean): string | undefined {
  return overdue ? 'text-destructive/85' : undefined;
}

export function loanScheduleOverdueDueDateClassName(overdue: boolean): string | undefined {
  return overdue ? 'text-destructive/85 font-medium' : undefined;
}

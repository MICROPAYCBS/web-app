/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanScheduleData } from '@mifos/api-client';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function scheduleCurrencyCode(schedule: LoanScheduleData): string {
  return schedule.currency?.code ?? 'USD';
}

export function installmentAmount(
  period: NonNullable<LoanScheduleData['periods']>[number]
): number | undefined {
  return period.totalDueForPeriod ?? period.totalInstallmentAmountForPeriod;
}

export function installmentPeriods(schedule: LoanScheduleData) {
  return (schedule.periods ?? []).filter((row) => (row.period ?? 0) > 0);
}

export function scheduleHighlights(schedule: LoanScheduleData) {
  const installments = installmentPeriods(schedule);
  const first = installments[0];
  const last = installments[installments.length - 1];
  const totalRepayment = schedule.totalRepaymentExpected ?? 0;
  const averageInstallment =
    installments.length > 0 ? totalRepayment / installments.length : undefined;

  return {
    installmentCount: installments.length,
    firstRepaymentDate: first?.dueDate,
    lastRepaymentDate: last?.dueDate,
    averageInstallment
  };
}

export function formatScheduleMoney(
  amount: number | undefined,
  currencyCode: string
): string {
  return formatAccountMoney(amount, currencyCode);
}

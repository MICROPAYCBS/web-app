import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanScheduleData } from '@mifos/api-client';
import { formatFineractDateValue } from '@/lib/fineract/dates';

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function normalizeLoanScheduleData(raw: unknown): LoanScheduleData | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const currencyRaw = row.currency;
  const currency =
    currencyRaw && typeof currencyRaw === 'object'
      ? {
          code:
            typeof (currencyRaw as Record<string, unknown>).code === 'string'
              ? ((currencyRaw as Record<string, unknown>).code as string)
              : undefined,
          name:
            typeof (currencyRaw as Record<string, unknown>).name === 'string'
              ? ((currencyRaw as Record<string, unknown>).name as string)
              : undefined,
          decimalPlaces: toNumber((currencyRaw as Record<string, unknown>).decimalPlaces),
          displaySymbol:
            typeof (currencyRaw as Record<string, unknown>).displaySymbol === 'string'
              ? ((currencyRaw as Record<string, unknown>).displaySymbol as string)
              : undefined,
          displayLabel:
            typeof (currencyRaw as Record<string, unknown>).displayLabel === 'string'
              ? ((currencyRaw as Record<string, unknown>).displayLabel as string)
              : undefined
        }
      : undefined;

  const periods = Array.isArray(row.periods)
    ? row.periods
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const period = item as Record<string, unknown>;
          return {
            period: toNumber(period.period),
            fromDate: formatFineractDateValue(period.fromDate),
            dueDate: formatFineractDateValue(period.dueDate),
            daysInPeriod: toNumber(period.daysInPeriod),
            principalDisbursed: toNumber(period.principalDisbursed),
            principalDue: toNumber(period.principalDue),
            interestDue: toNumber(period.interestDue),
            feeChargesDue: toNumber(period.feeChargesDue),
            penaltyChargesDue: toNumber(period.penaltyChargesDue),
            principalOutstanding: toNumber(period.principalOutstanding),
            interestOutstanding: toNumber(period.interestOutstanding),
            feeChargesOutstanding: toNumber(period.feeChargesOutstanding),
            penaltyChargesOutstanding: toNumber(period.penaltyChargesOutstanding),
            totalDueForPeriod: toNumber(period.totalDueForPeriod),
            totalInstallmentAmountForPeriod: toNumber(
              period.totalInstallmentAmountForPeriod
            ),
            totalOutstandingForPeriod: toNumber(period.totalOutstandingForPeriod),
            totalOverdue: toNumber(period.totalOverdue),
            principalLoanBalanceOutstanding: toNumber(
              period.principalLoanBalanceOutstanding
            ),
            complete: period.complete === true,
            downPaymentPeriod: period.downPaymentPeriod === true
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null)
    : [];

  return {
    currency,
    loanTermInDays: toNumber(row.loanTermInDays),
    totalPrincipalDisbursed: toNumber(row.totalPrincipalDisbursed),
    totalPrincipalExpected: toNumber(row.totalPrincipalExpected),
    totalInterestCharged: toNumber(row.totalInterestCharged),
    totalFeeChargesCharged: toNumber(row.totalFeeChargesCharged),
    totalPenaltyChargesCharged: toNumber(row.totalPenaltyChargesCharged),
    totalRepaymentExpected: toNumber(row.totalRepaymentExpected),
    periods
  };
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanScheduleData, LoanSchedulePeriod } from '@mifos/api-client';
import type { LoanVariableInstallmentAmountKind } from '@mifos/validation';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { parseFineractDateString, toFineractDate, toLocalCalendarDate } from '@/lib/fineract/dates';

export type VariableInstallmentDraft = {
  key: string;
  period?: number;
  originalDueDate?: string;
  dueDate: string;
  amount: number;
  originalAmount: number;
  principalDue?: number;
  interestDue?: number;
  feeChargesDue?: number;
  principalLoanBalanceOutstanding?: number;
  downPaymentPeriod?: boolean;
  isNew?: boolean;
  deleted?: boolean;
};

export type VariableScheduleExceptionsPayload = {
  modifiedinstallments: Array<{
    dueDate: string;
    modifiedDueDate?: string;
    principal?: number;
    installmentAmount?: number;
  }>;
  newinstallments: Array<{
    dueDate: string;
    principal?: number;
    installmentAmount?: number;
  }>;
  deletedinstallments: Array<{ dueDate: string }>;
};

/** Declining-balance equal installments send installment amount; otherwise principal. */
export function loanVariableInstallmentAmountKind(account: {
  interestType?: { id?: number };
  amortizationType?: { id?: number };
}): LoanVariableInstallmentAmountKind {
  return account.interestType?.id === 0 && account.amortizationType?.id === 1
    ? 'installmentAmount'
    : 'principal';
}

export function loanVariableInstallmentAmountLabel(
  amountKind: LoanVariableInstallmentAmountKind
): string {
  return amountKind === 'installmentAmount' ? 'Installment amount' : 'Principal due';
}

export function toFineractFormDate(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = parseFineractDateString(value);
  if (parsed) {
    return toFineractDate(parsed);
  }
  const native = new Date(value);
  if (!Number.isNaN(native.getTime())) {
    return toFineractDate(toLocalCalendarDate(native));
  }
  return undefined;
}

function periodAmount(
  period: LoanSchedulePeriod,
  amountKind: LoanVariableInstallmentAmountKind
): number {
  if (amountKind === 'installmentAmount') {
    return period.totalDueForPeriod ?? period.totalInstallmentAmountForPeriod ?? 0;
  }
  return period.principalDue ?? 0;
}

export function variableInstallmentDraftsFromSchedule(
  schedule: LoanScheduleData | null | undefined,
  amountKind: LoanVariableInstallmentAmountKind
): VariableInstallmentDraft[] {
  return (schedule?.periods ?? [])
    .filter((period) => (period.period ?? 0) > 0 && Boolean(period.dueDate))
    .map((period, index) => {
      const dueDate = toFineractFormDate(period.dueDate) ?? period.dueDate ?? '';
      const amount = periodAmount(period, amountKind);
      return {
        key: `period-${period.period ?? index}`,
        period: period.period,
        originalDueDate: dueDate,
        dueDate,
        amount,
        originalAmount: amount,
        principalDue: period.principalDue,
        interestDue: period.interestDue,
        feeChargesDue: period.feeChargesDue,
        principalLoanBalanceOutstanding: period.principalLoanBalanceOutstanding,
        downPaymentPeriod: period.downPaymentPeriod === true
      };
    });
}

export function buildVariableScheduleExceptions(
  drafts: VariableInstallmentDraft[],
  amountKind: LoanVariableInstallmentAmountKind
): VariableScheduleExceptionsPayload {
  const modifiedinstallments: VariableScheduleExceptionsPayload['modifiedinstallments'] = [];
  const newinstallments: VariableScheduleExceptionsPayload['newinstallments'] = [];
  const deletedinstallments: VariableScheduleExceptionsPayload['deletedinstallments'] = [];

  for (const row of drafts) {
    const dueDate = toFineractFormDate(row.dueDate) ?? row.dueDate;
    const originalDueDate = row.originalDueDate
      ? (toFineractFormDate(row.originalDueDate) ?? row.originalDueDate)
      : undefined;

    if (row.isNew) {
      if (row.deleted || !dueDate) {
        continue;
      }
      newinstallments.push({
        dueDate,
        [amountKind]: row.amount
      });
      continue;
    }

    if (row.deleted) {
      if (originalDueDate) {
        deletedinstallments.push({ dueDate: originalDueDate });
      }
      continue;
    }

    if (!originalDueDate || !dueDate) {
      continue;
    }

    const dateChanged = dueDate !== originalDueDate;
    const amountChanged = row.amount !== row.originalAmount;
    if (!dateChanged && !amountChanged) {
      continue;
    }

    modifiedinstallments.push({
      dueDate: originalDueDate,
      ...(dateChanged ? { modifiedDueDate: dueDate } : {}),
      ...(amountChanged ? { [amountKind]: row.amount } : {})
    });
  }

  return { modifiedinstallments, newinstallments, deletedinstallments };
}

export function hasVariableScheduleChanges(drafts: VariableInstallmentDraft[]): boolean {
  const payload = buildVariableScheduleExceptions(drafts, 'installmentAmount');
  return (
    payload.modifiedinstallments.length > 0 ||
    payload.newinstallments.length > 0 ||
    payload.deletedinstallments.length > 0
  );
}

export function visibleVariableInstallmentDrafts(
  drafts: VariableInstallmentDraft[]
): VariableInstallmentDraft[] {
  return drafts.filter((row) => !row.deleted);
}

export function canDeleteVariableInstallment(
  drafts: VariableInstallmentDraft[],
  key: string
): boolean {
  const visible = visibleVariableInstallmentDrafts(drafts);
  if (visible.length <= 1) {
    return false;
  }
  const row = drafts.find((item) => item.key === key);
  if (!row || row.deleted || row.downPaymentPeriod) {
    return false;
  }
  const last = visible[visible.length - 1];
  return last?.key !== key;
}

export function loanVariableInstallmentGapHint(account: FineractLoanAccountDetail): string | null {
  const min = account.minimumGap;
  const max = account.maximumGap;
  if (min == null && max == null) {
    return null;
  }
  if (min != null && max != null) {
    return `Installment dates must stay between ${min} and ${max} days apart.`;
  }
  if (min != null) {
    return `Installment dates must stay at least ${min} days apart.`;
  }
  return `Installment dates must stay at most ${max} days apart.`;
}

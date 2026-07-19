/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountChargeOption, ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanAccountChargeItemInput, LoanApplicationChargeAmountLimit } from '@mifos/validation';
import {
  chargeAmountCurrencyCode,
  isPercentageChargeCalculation,
  type ChargeAmountLike
} from '@/lib/fineract/charge-display';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

function isAccountTransferChargePaymentMode(option: ClientLoanAccountChargeOption): boolean {
  const label = enumOptionLabel(option.chargePaymentMode)?.trim().toLowerCase() ?? '';
  const code = option.chargePaymentMode?.code?.trim().toLowerCase() ?? '';
  return label === 'account transfer' || code.includes('account.transfer');
}

export function isAccountTransferChargeOption(
  option: ClientLoanAccountChargeOption | undefined
): boolean {
  return option != null && isAccountTransferChargePaymentMode(option);
}

export function draftHasAccountTransferCharge(
  template: ClientLoanAccountTemplate,
  charges: LoanAccountChargeItemInput[] | undefined
): boolean {
  for (const charge of charges ?? []) {
    const meta = loanAccountChargeMetadata(template, charge.chargeId);
    if (isAccountTransferChargeOption(meta)) {
      return true;
    }
  }
  return false;
}

function chargeOptionId(option: ClientLoanAccountChargeOption): number | undefined {
  const id = option.chargeId ?? option.id;
  return id != null && Number.isFinite(id) ? id : undefined;
}

export function chargeAmountForApplication(option: ChargeAmountLike): number {
  if (isPercentageChargeCalculation(option.chargeCalculationType?.id)) {
    const row = option as ClientLoanAccountChargeOption;
    return row.amountOrPercentage ?? row.percentage ?? option.amount ?? 0;
  }
  return option.amount ?? 0;
}

export function defaultLoanAccountChargesFromTemplate(
  productCharges: ClientLoanAccountChargeOption[] | undefined
): LoanAccountChargeItemInput[] {
  const unique = new Map<number, LoanAccountChargeItemInput>();

  for (const charge of productCharges ?? []) {
    const chargeId = chargeOptionId(charge);
    if (chargeId == null || unique.has(chargeId)) {
      continue;
    }
    unique.set(chargeId, {
      chargeId,
      amount: chargeAmountForApplication(charge)
    });
  }

  return [...unique.values()];
}

export function loanAccountChargeOptionsForApplication(
  template: ClientLoanAccountTemplate
): ClientLoanAccountChargeOption[] {
  return template.chargeOptions ?? [];
}

export function loanAccountChargeMetadata(
  template: ClientLoanAccountTemplate,
  chargeId: number
): ClientLoanAccountChargeOption | undefined {
  const pool = [
    ...(template.chargeOptions ?? []),
    ...(template.charges ?? []),
    ...(template.overdueCharges ?? [])
  ];
  return pool.find((option) => chargeOptionId(option) === chargeId);
}

function loanApplicationChargeAmountLimit(
  option: ClientLoanAccountChargeOption,
  applicationCurrencyCode?: string
): LoanApplicationChargeAmountLimit | undefined {
  const chargeId = chargeOptionId(option);
  if (chargeId == null) {
    return undefined;
  }

  return {
    chargeId,
    name: option.name,
    minCap: typeof option.minCap === 'number' ? option.minCap : undefined,
    maxCap: typeof option.maxCap === 'number' ? option.maxCap : undefined,
    chargeCalculationTypeId: option.chargeCalculationType?.id,
    currencyCode: chargeAmountCurrencyCode(option, applicationCurrencyCode)
  };
}

export function loanApplicationChargeAmountLimits(
  template: ClientLoanAccountTemplate
): LoanApplicationChargeAmountLimit[] {
  const applicationCurrencyCode = template.currency?.code;
  const pool = [
    ...(template.chargeOptions ?? []),
    ...(template.charges ?? []),
    ...(template.overdueCharges ?? [])
  ];
  const unique = new Map<number, LoanApplicationChargeAmountLimit>();

  for (const option of pool) {
    const limit = loanApplicationChargeAmountLimit(option, applicationCurrencyCode);
    if (limit != null) {
      unique.set(limit.chargeId, limit);
    }
  }

  return [...unique.values()];
}

export function chargeExpectsDueDate(option?: ClientLoanAccountChargeOption): boolean {
  const label = enumOptionLabel(option?.chargeTimeType) ?? '';
  return label === 'Specified due date' || label === 'Weekly Fee';
}

export function chargeExpectsFeeOnMonthDay(option?: ClientLoanAccountChargeOption): boolean {
  const label = enumOptionLabel(option?.chargeTimeType) ?? '';
  return label === 'Monthly Fee' || label === 'Annual Fee' || label === 'Weekly Fee';
}

export function chargeDateLabel(option?: ClientLoanAccountChargeOption): string {
  if (chargeExpectsDueDate(option)) {
    return 'Due date';
  }
  if (chargeExpectsFeeOnMonthDay(option)) {
    return enumOptionLabel(option?.chargeTimeType) === 'Annual Fee' ? 'Fee day' : 'Fee date';
  }
  return 'Date';
}

export function formatLoanAccountChargeDate(charge: LoanAccountChargeItemInput): string {
  if (charge.dueDate?.trim()) {
    return charge.dueDate;
  }
  if (charge.feeOnMonthDay?.trim()) {
    return charge.feeOnMonthDay;
  }
  return '—';
}

export function uniqueLoanAccountCharges(
  charges: LoanAccountChargeItemInput[]
): LoanAccountChargeItemInput[] {
  const unique = new Map<number, LoanAccountChargeItemInput>();
  for (const charge of charges) {
    unique.set(charge.chargeId, charge);
  }
  return [...unique.values()];
}

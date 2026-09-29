/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientActiveLoanOption } from '@mifos/api-client';
import { toDecimal } from '@mifos/domain';
import { parseFineractDateString } from '@/lib/fineract/dates';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export interface LoanTopupPayoff {
  amount: number;
  principalPortion?: number;
  interestPortion?: number;
  feeChargesPortion?: number;
  penaltyChargesPortion?: number;
}

export interface LoanTopupContext {
  accountNo: string;
  productName?: string;
  currencyCode?: string;
  active: boolean;
  blocked: boolean;
  actualDisbursementDate?: string;
  lastUserTransactionDate?: string;
  payoff: LoanTopupPayoff | null;
}

export interface PendingTopupClosure {
  loanId: number;
  accountNo: string;
  closureLoanId: number;
}

export interface TopupChargeInput {
  amount: number;
  chargeTimeTypeId?: number;
  chargeTimeTypeCode?: string;
  calculationTypeId?: number;
}

const PERCENT_OF_AMOUNT = 2;
const PERCENT_OF_AMOUNT_AND_INTEREST = 3;
const PERCENT_OF_INTEREST = 4;
const PERCENT_OF_DISBURSEMENT = 5;

const TOPUP_FIELDS_BY_STEP: Record<string, string[]> = {
  core: ['loanIdToClose'],
  financial: ['principal'],
  timeline: ['submittedOnDate', 'expectedDisbursementDate'],
  charges: [],
  schedule: ['loanIdToClose', 'principal', 'submittedOnDate', 'expectedDisbursementDate'],
  preview: ['loanIdToClose', 'principal', 'submittedOnDate', 'expectedDisbursementDate']
};

/** Product template may copy `canUseForTopup` onto `isTopup`. A saved loan's `isTopup` is the user's choice. */
export function loanTemplateAllowsTopup(row: {
  id?: unknown;
  canUseForTopup?: unknown;
  isTopup?: unknown;
  product?: { canUseForTopup?: unknown } | null;
}): boolean {
  if (row.canUseForTopup === true || row.product?.canUseForTopup === true) {
    return true;
  }
  const id = typeof row.id === 'number' ? row.id : Number(row.id);
  const savedLoan = Number.isFinite(id) && id > 0;
  return !savedLoan && row.isTopup === true;
}

export function loanTopupSectionVisible(
  canUseForTopup: boolean | undefined,
  clientId: number | null | undefined
): boolean {
  return canUseForTopup === true && clientId != null && clientId > 0;
}

export function loanTopupShowsNetDisbursal(status: {
  value?: string;
  code?: string;
  active?: boolean;
}): boolean {
  if (status.active === true) {
    return true;
  }
  const value = status.value ?? '';
  if (value === 'Approved' || value === 'Active' || value === 'Overpaid') {
    return true;
  }
  if (value.startsWith('Closed')) {
    return true;
  }
  const code = status.code ?? '';
  return (
    code === 'loanStatusType.approved' ||
    code === 'loanStatusType.active' ||
    code === 'loanStatusType.overpaid' ||
    code.startsWith('loanStatusType.closed')
  );
}

export function normalizeClientActiveLoanOptions(value: unknown): ClientActiveLoanOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const options: ClientActiveLoanOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'number' ? row.id : Number(row.id);
    if (!Number.isFinite(id)) {
      continue;
    }
    const currency =
      row.currency && typeof row.currency === 'object'
        ? (row.currency as Record<string, unknown>)
        : undefined;
    const balance = row.loanBalance == null ? 0 : Number(row.loanBalance);
    options.push({
      id,
      accountNo: typeof row.accountNo === 'string' ? row.accountNo : undefined,
      productName:
        typeof row.productName === 'string'
          ? row.productName
          : typeof row.loanProductName === 'string'
            ? row.loanProductName
            : undefined,
      loanBalance: Number.isFinite(balance) ? balance : 0,
      currency:
        currency && typeof currency.code === 'string'
          ? {
              code: currency.code,
              name: typeof currency.name === 'string' ? currency.name : undefined
            }
          : undefined
    });
  }
  return options;
}

export function activeLoansForTopup(
  options: ClientActiveLoanOption[] | undefined,
  currencyCode: string | undefined
): ClientActiveLoanOption[] {
  const code = currencyCode?.trim().toUpperCase();
  if (!code) {
    return [];
  }
  return (options ?? []).filter(
    (option) => (option.currency?.code ?? '').trim().toUpperCase() === code
  );
}

export function activeLoanOptionLabel(option: ClientActiveLoanOption): string {
  const code = option.currency?.code?.trim() ?? '';
  const identity = [option.accountNo, option.productName, code].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  const outstanding = formatAccountMoney(option.loanBalance ?? 0, code || undefined);
  return `${identity.join(' · ')} · Outstanding ${outstanding}`;
}

export function isDueAtDisbursement(chargeTimeType?: {
  id?: number;
  code?: string;
}): boolean {
  if (chargeTimeType?.id === 1) {
    return true;
  }
  const code = chargeTimeType?.code?.toLowerCase() ?? '';
  return code.includes('disbursement') && !code.includes('tranche');
}

export function isTopupUserTransaction(code?: string, value?: string): boolean {
  const text = `${code ?? ''} ${value ?? ''}`.toLowerCase();
  if (!text.trim() || text.includes('accrual')) {
    return false;
  }
  if (
    text.includes('chargeback') ||
    text.includes('charge-back') ||
    text.includes('charge.off') ||
    text.includes('chargeoff')
  ) {
    return false;
  }
  return text.includes('repayment') || text.includes('waiver') || text.includes('waive') || text.includes('charge');
}

export function compareFormDates(left: string, right: string): number | null {
  const a = parseFineractDateString(left);
  const b = parseFineractDateString(right);
  if (!a || !b) {
    return null;
  }
  return a.getTime() - b.getTime();
}

export function lastTopupUserTransactionDate(
  actualDisbursementDate: string | undefined,
  transactions: { reversed?: boolean; date?: string; code?: string; value?: string }[]
): string | undefined {
  const disbursement = actualDisbursementDate?.trim();
  if (!disbursement || parseFineractDateString(disbursement) == null) {
    return undefined;
  }
  let best = disbursement;
  for (const transaction of transactions) {
    if (transaction.reversed || !transaction.date) {
      continue;
    }
    if (!isTopupUserTransaction(transaction.code, transaction.value)) {
      continue;
    }
    const compared = compareFormDates(transaction.date, best);
    if (compared != null && compared > 0) {
      best = transaction.date;
    }
  }
  return best;
}

export function amountCoversPayoff(amount: number, payoff: number): boolean {
  const left = toDecimal(amount);
  const right = toDecimal(payoff);
  if (!left || !right) {
    return false;
  }
  return left.greaterThanOrEqualTo(right);
}

export function topupCashToClient(
  firstDisbursement: number,
  payoff: number,
  disbursementCharges: number
): number {
  const first = toDecimal(firstDisbursement);
  const closeAmount = toDecimal(payoff);
  const charges = toDecimal(disbursementCharges);
  if (!first || !closeAmount || !charges) {
    return 0;
  }
  return first.minus(closeAmount).minus(charges).toNumber();
}

export function estimateApplicationDisbursementCharges(
  charges: TopupChargeInput[],
  principal: number
): { total: number; omittedInterestBased: boolean } {
  let total = toDecimal(0);
  let omittedInterestBased = false;
  if (!total) {
    return { total: 0, omittedInterestBased: false };
  }
  const base = toDecimal(principal) ?? toDecimal(0);
  for (const charge of charges) {
    if (
      !isDueAtDisbursement({
        id: charge.chargeTimeTypeId,
        code: charge.chargeTimeTypeCode
      })
    ) {
      continue;
    }
    if (
      charge.calculationTypeId === PERCENT_OF_AMOUNT_AND_INTEREST ||
      charge.calculationTypeId === PERCENT_OF_INTEREST
    ) {
      omittedInterestBased = true;
      continue;
    }
    const amount = toDecimal(charge.amount);
    if (!amount || !base) {
      continue;
    }
    if (
      charge.calculationTypeId === PERCENT_OF_AMOUNT ||
      charge.calculationTypeId === PERCENT_OF_DISBURSEMENT
    ) {
      total = total.plus(base.times(amount).div(100));
      continue;
    }
    total = total.plus(amount);
  }
  return { total: total.toNumber(), omittedInterestBased };
}

export function sumAccountDisbursementCharges(
  charges: { chargeTimeType?: { id?: number; code?: string }; amount?: number }[] | undefined
): number {
  let total = toDecimal(0);
  if (!total) {
    return 0;
  }
  for (const charge of charges ?? []) {
    if (!isDueAtDisbursement(charge.chargeTimeType)) {
      continue;
    }
    const amount = toDecimal(charge.amount ?? 0);
    if (amount) {
      total = total.plus(amount);
    }
  }
  return total.toNumber();
}

export function earliestDisbursementTranche<
  T extends { expectedDisbursementDate: string; principal: number }
>(tranches: readonly T[]): T | null {
  let best: T | null = null;
  let bestTime = Number.POSITIVE_INFINITY;
  for (const tranche of tranches) {
    const date = parseFineractDateString(tranche.expectedDisbursementDate);
    if (!date) {
      continue;
    }
    if (date.getTime() < bestTime) {
      best = tranche;
      bestTime = date.getTime();
    }
  }
  return best;
}

export function buildLoanTopupFieldErrors(input: {
  isTopup: boolean;
  loanIdToClose?: number;
  close?: Pick<
    LoanTopupContext,
    'active' | 'blocked' | 'currencyCode' | 'actualDisbursementDate' | 'lastUserTransactionDate'
  > | null;
  closeFailed?: boolean;
  productCurrencyCode?: string;
  payoffAmount?: number | null;
  principal: number;
  submittedOnDate: string;
  expectedDisbursementDate: string;
}): Record<string, string> {
  if (!input.isTopup) {
    return {};
  }
  const errors: Record<string, string> = {};
  if (input.loanIdToClose == null || input.loanIdToClose <= 0) {
    errors.loanIdToClose = 'Choose an active loan of this client';
  } else if (input.closeFailed) {
    errors.loanIdToClose = 'Choose an active loan of this client';
  } else if (input.close?.blocked) {
    errors.loanIdToClose = 'This loan cannot be closed by a top-up';
  } else if (input.close && !input.close.active) {
    errors.loanIdToClose = 'That loan is no longer active';
  } else if (
    input.close?.currencyCode &&
    input.productCurrencyCode &&
    input.close.currencyCode.trim().toUpperCase() !== input.productCurrencyCode.trim().toUpperCase()
  ) {
    errors.loanIdToClose = 'The loan to close must use the same currency';
  }

  if (
    input.payoffAmount != null &&
    input.principal > 0 &&
    !amountCoversPayoff(input.principal, input.payoffAmount)
  ) {
    errors.principal = 'Principal must cover the payoff';
  }

  if (input.close?.actualDisbursementDate && input.submittedOnDate.trim()) {
    const compared = compareFormDates(input.submittedOnDate, input.close.actualDisbursementDate);
    if (compared != null && compared <= 0) {
      errors.submittedOnDate = 'Application date must be after that loan was disbursed';
    }
  }

  if (input.close?.lastUserTransactionDate && input.expectedDisbursementDate.trim()) {
    const compared = compareFormDates(
      input.expectedDisbursementDate,
      input.close.lastUserTransactionDate
    );
    if (compared != null && compared < 0) {
      errors.expectedDisbursementDate =
        "Disbursement must be on or after that loan's last transaction";
    }
  }

  return errors;
}

export function loanTopupErrorsForStep(
  stepId: string,
  errors: Record<string, string>
): Record<string, string> {
  const fields = TOPUP_FIELDS_BY_STEP[stepId];
  if (!fields) {
    return {};
  }
  return Object.fromEntries(Object.entries(errors).filter(([key]) => fields.includes(key)));
}

export function loanTopupCommandBlocker(input: {
  context: LoanTopupContext | null;
  failed: boolean;
  amount: number;
  transactionDate: string;
}): string | null {
  if (input.failed) {
    return 'Choose an active loan of this client';
  }
  if (!input.context) {
    return null;
  }
  if (input.context.blocked) {
    return 'This loan cannot be closed by a top-up';
  }
  if (!input.context.active) {
    return 'That loan is no longer active';
  }
  if (input.context.lastUserTransactionDate && input.transactionDate.trim()) {
    const compared = compareFormDates(input.transactionDate, input.context.lastUserTransactionDate);
    if (compared != null && compared < 0) {
      return "Disbursement must be on or after that loan's last transaction";
    }
  }
  if (
    input.context.payoff &&
    input.amount > 0 &&
    !amountCoversPayoff(input.amount, input.context.payoff.amount)
  ) {
    return 'Principal must cover the payoff';
  }
  return null;
}

export function loanIsActiveStatus(status: {
  active?: boolean;
  value?: string;
  code?: string;
} | undefined): boolean {
  if (!status) {
    return false;
  }
  return (
    status.active === true ||
    status.value === 'Active' ||
    status.code === 'loanStatusType.active'
  );
}

export function loanIsPendingApprovalStatus(status: {
  submittedAndPendingApproval?: boolean;
  pendingApproval?: boolean;
  value?: string;
  code?: string;
} | undefined): boolean {
  if (!status) {
    return false;
  }
  return (
    status.submittedAndPendingApproval === true ||
    status.pendingApproval === true ||
    status.value === 'Submitted and pending approval' ||
    status.code === 'loanStatusType.submitted.and.pending.approval'
  );
}

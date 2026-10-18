/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { toDecimal } from '@mifos/domain';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  loanAccountLinkedAccountId,
  loanAccountLinkedAccountLabel,
  loanAccountProductName
} from '@/lib/fineract/loan-account-display';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import {
  LOAN_PORTFOLIO_ACCOUNT_TYPE,
  SAVINGS_PORTFOLIO_ACCOUNT_TYPE
} from '@/lib/fineract/portfolio-account-types';

export function loanAccountRepaymentTransferGeneralPath(
  clientId: string,
  accountId: string | number
): string {
  return clientAccountGeneralPath(clientId, 'loan', accountId);
}

export function loanAccountCanRepayFromSavings(account: FineractLoanAccountDetail): boolean {
  return loanAccountLinkedAccountId(account) != null;
}

export function loanAccountRepaymentTransferCascade(
  clientId: string,
  fromOfficeId: number,
  loanAccountId: number
): Record<string, string> {
  return {
    toOfficeId: String(fromOfficeId),
    toClientId: clientId,
    toAccountType: String(LOAN_PORTFOLIO_ACCOUNT_TYPE),
    toAccountId: String(loanAccountId)
  };
}

function positiveAmount(value: number | undefined): number | undefined {
  const decimal = toDecimal(value);
  if (!decimal || !decimal.greaterThan(0)) {
    return undefined;
  }
  return decimal.toNumber();
}

/** Remaining amount on the earliest unpaid installment. */
export function loanInstallmentAmountDue(account: FineractLoanAccountDetail): number | undefined {
  for (const period of account.repaymentSchedule?.periods ?? []) {
    if (period.period == null || period.complete) {
      continue;
    }
    const due = positiveAmount(period.totalOutstandingForPeriod ?? period.totalDueForPeriod);
    if (due != null) {
      return due;
    }
  }
  return undefined;
}

export interface LoanAccountDueBalance {
  /** Overdue when installments are past due; otherwise the next unpaid installment. */
  label: 'Overdue' | 'Due';
  amount: number;
}

/**
 * Summary figure beside the current balance. Overdue wins when the loan is in
 * arrears. Otherwise this is the amount still due on the next unpaid installment,
 * or zero when nothing is payable.
 */
export function loanAccountDueBalance(
  account: FineractLoanAccountDetail
): LoanAccountDueBalance | null {
  if (!account.summary) {
    return null;
  }
  const overdue = positiveAmount(account.summary.totalOverdue);
  if (overdue != null) {
    return { label: 'Overdue', amount: overdue };
  }
  const due = loanInstallmentAmountDue(account);
  if (due != null) {
    return { label: 'Due', amount: due };
  }
  return { label: 'Overdue', amount: 0 };
}

/**
 * Payment default: the overdue total when the loan is in arrears, otherwise the
 * amount due on the next unpaid installment.
 */
export function loanPaymentDefaultAmount(
  account: FineractLoanAccountDetail,
  amountDue?: number
): number | undefined {
  return (
    positiveAmount(account.summary?.totalOverdue) ??
    positiveAmount(amountDue) ??
    loanInstallmentAmountDue(account)
  );
}

export const LOAN_REPAYMENT_EXCEEDS_OUTSTANDING_MESSAGE =
  'Amount cannot exceed the outstanding balance.';

export const LOAN_REPAYMENT_OUTSTANDING_UNAVAILABLE_MESSAGE =
  'Outstanding balance is not available for this loan.';

/** Written-off recovery is not limited by the outstanding balance, which is already zero. */
const WRITTEN_OFF_LOAN_STATUS = 'loanStatusType.closed.written.off';

const ACTIVE_SAVINGS_STATUS = 'savingsAccountStatusType.active';

export interface LoanRepaymentSavingsCandidate {
  id: number;
  accountNo?: string;
  productName?: string;
  statusCode?: string;
  currencyCode?: string;
  depositType?: string;
}

export function loanRepaymentSavingsSourceLabel(account: LoanRepaymentSavingsCandidate): string {
  const parts = [account.productName?.trim(), account.accountNo?.trim()].filter(
    (part): part is string => Boolean(part)
  );
  return parts.length ? parts.join(' · ') : `Savings account #${account.id}`;
}

/** Active savings accounts in the loan currency. Fixed and recurring deposits are excluded. */
export function loanRepaymentSavingsSources(
  accounts: readonly LoanRepaymentSavingsCandidate[],
  currencyCode: string
): LoanRepaymentSavingsCandidate[] {
  const currency = currencyCode.trim().toUpperCase();
  return accounts.filter((account) => {
    if (!(account.id > 0) || account.statusCode !== ACTIVE_SAVINGS_STATUS) {
      return false;
    }
    if ((account.currencyCode ?? '').trim().toUpperCase() !== currency) {
      return false;
    }
    const depositType = account.depositType?.trim();
    return depositType !== 'Fixed Deposit' && depositType !== 'Recurring Deposit';
  });
}

export function loanRepaymentSavingsUnavailableMessage(currencyCode: string): string {
  return `This customer has no active ${currencyCode} savings account.`;
}

export function loanRepaymentRejectsOverpayment(statusCode: string | undefined): boolean {
  return statusCode !== WRITTEN_OFF_LOAN_STATUS;
}

/**
 * Repayments may pay the outstanding balance in full. Anything above it becomes
 * an overpayment, which this product does not accept. An empty amount is left
 * for the form schema.
 */
export function loanRepaymentOverpaymentError(
  amount: string | number | null | undefined,
  outstanding: number | null | undefined
): string | null {
  const payment = toDecimal(typeof amount === 'string' ? amount.trim() : amount);
  if (!payment || !payment.greaterThan(0)) {
    return null;
  }
  const owed = toDecimal(outstanding);
  if (!owed) {
    return LOAN_REPAYMENT_OUTSTANDING_UNAVAILABLE_MESSAGE;
  }
  if (payment.greaterThan(owed)) {
    return LOAN_REPAYMENT_EXCEEDS_OUTSTANDING_MESSAGE;
  }
  return null;
}

export function loanAccountRepaymentTransferDefaults(
  account: FineractLoanAccountDetail,
  availableBalance: number,
  kind: 'repayment' | 'recoverypayment' = 'repayment'
): { transferAmount: string; transferDescription: string } {
  const outstanding = account.summary?.totalOutstanding;
  let amount =
    kind === 'repayment'
      ? loanPaymentDefaultAmount(account)
      : outstanding != null && outstanding > 0
        ? outstanding
        : undefined;
  const balance = toDecimal(availableBalance);
  let chosen = toDecimal(amount);
  if (chosen && balance && balance.greaterThan(0) && chosen.greaterThan(balance)) {
    amount = balance.toNumber();
    chosen = toDecimal(amount);
  }
  if (kind === 'repayment') {
    const owed = toDecimal(outstanding);
    if (chosen && owed && chosen.greaterThan(owed)) {
      amount = owed.toNumber();
    }
  }
  const label =
    kind === 'recoverypayment'
      ? `Recovery payment — ${loanAccountProductName(account)}`
      : `Repayment — ${loanAccountProductName(account)}`;
  return {
    transferAmount: amount != null && amount > 0 ? String(amount) : '',
    transferDescription: label
  };
}

export function loanRepaymentTransferAccountTypes() {
  return {
    fromAccountType: SAVINGS_PORTFOLIO_ACCOUNT_TYPE,
    toAccountType: LOAN_PORTFOLIO_ACCOUNT_TYPE
  };
}

export function loanAccountLinkedSavingsLabel(account: FineractLoanAccountDetail): string | null {
  return loanAccountLinkedAccountLabel(account);
}

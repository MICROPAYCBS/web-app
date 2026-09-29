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
  const chosen = toDecimal(amount);
  if (chosen && balance && balance.greaterThan(0) && chosen.greaterThan(balance)) {
    amount = balance.toNumber();
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

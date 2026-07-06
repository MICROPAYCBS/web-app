/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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

export function loanAccountRepaymentTransferDefaults(
  account: FineractLoanAccountDetail,
  availableBalance: number,
  kind: 'repayment' | 'recoverypayment' = 'repayment'
): { transferAmount: string; transferDescription: string } {
  const outstanding = account.summary?.totalOutstanding;
  let amount = outstanding != null && outstanding > 0 ? outstanding : undefined;
  if (amount != null && availableBalance > 0) {
    amount = Math.min(amount, availableBalance);
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

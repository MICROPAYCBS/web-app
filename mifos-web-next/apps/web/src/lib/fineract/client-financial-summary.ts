/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientAccounts, FineractClientLoanAccount } from '@mifos/api-client';
import {
  filterOpenLoanAccounts,
  filterOpenSavingsAccounts,
  filterOpenShareAccounts,
  filterSavingsByDepositType,
  mergeClientLoanAccounts
} from '@/lib/fineract/client-accounts';

export interface ClientFinancialSummary {
  savingsBalance: number;
  activeSavings: number;
  approvedShares: number;
  pendingShares: number;
  activeShares: number;
  loanBalance: number;
  lastLoanAmount: number;
  lastLoanCurrencyCode?: string;
  activeLoans: number;
  loansTaken: number;
  closedLoans: number;
  currencyCode?: string;
}

function isActiveShareStatus(status: { active?: boolean; value?: string; code?: string } | undefined): boolean {
  if (!status) {
    return false;
  }
  if (status.code === 'shareAccountStatusType.active') {
    return true;
  }
  return isActiveAccountStatus(status);
}

function isActiveAccountStatus(status: { active?: boolean; value?: string; code?: string } | undefined): boolean {
  if (!status) {
    return false;
  }
  if (status.active === true) {
    return true;
  }
  const label = status.value?.trim().toLowerCase();
  return label === 'active' || label === 'approved' || label === 'active (in arrears)';
}

function pickCurrencyCode(
  ...groups: { currency?: { code?: string } }[][]
): string | undefined {
  for (const accounts of groups) {
    for (const account of accounts) {
      const code = account.currency?.code?.trim();
      if (code) {
        return code;
      }
    }
  }
  return undefined;
}

/** Most recent loan by account id; uses `originalLoan` from the accounts payload. */
function pickLastLoanAmount(loans: FineractClientLoanAccount[]): {
  amount: number;
  currencyCode?: string;
} {
  if (loans.length === 0) {
    return { amount: 0 };
  }
  const latest = [...loans].sort((a, b) => b.id - a.id)[0];
  const currencyCode = latest.currency?.code?.trim();
  return {
    amount: latest.originalLoan ?? 0,
    currencyCode: currencyCode || undefined
  };
}

/** Aggregates balances and counts from GET /clients/{id}/accounts. */
export function buildClientFinancialSummary(accounts: FineractClientAccounts): ClientFinancialSummary {
  const allLoans = mergeClientLoanAccounts(accounts);
  const openLoans = filterOpenLoanAccounts(allLoans);
  const activeLoans = openLoans.filter((loan) => isActiveAccountStatus(loan.status));

  const allSavings = accounts.savingsAccounts ?? [];
  const openSavings = filterOpenSavingsAccounts(allSavings);
  const activeSavingsAccounts = filterSavingsByDepositType(openSavings, 'Savings').filter((account) =>
    isActiveAccountStatus(account.status)
  );

  const allShares = accounts.shareAccounts ?? [];
  const openShares = filterOpenShareAccounts(allShares);
  const activeShareAccounts = openShares.filter((account) => isActiveShareStatus(account.status));

  const savingsBalance = allSavings.reduce((sum, account) => sum + (account.accountBalance ?? 0), 0);
  const loanBalance = openLoans.reduce((sum, account) => sum + (account.loanBalance ?? 0), 0);
  const lastLoan = pickLastLoanAmount(allLoans);
  const approvedShares = activeShareAccounts.reduce(
    (sum, account) => sum + (account.totalApprovedShares ?? 0),
    0
  );
  const pendingShares = activeShareAccounts.reduce(
    (sum, account) => sum + (account.totalPendingForApprovalShares ?? 0),
    0
  );

  return {
    savingsBalance,
    activeSavings: activeSavingsAccounts.length,
    approvedShares,
    pendingShares,
    activeShares: activeShareAccounts.length,
    loanBalance,
    lastLoanAmount: lastLoan.amount,
    lastLoanCurrencyCode: lastLoan.currencyCode,
    activeLoans: activeLoans.length,
    loansTaken: allLoans.length,
    closedLoans: allLoans.length - openLoans.length,
    currencyCode: pickCurrencyCode(openLoans, activeLoans, allSavings)
  };
}

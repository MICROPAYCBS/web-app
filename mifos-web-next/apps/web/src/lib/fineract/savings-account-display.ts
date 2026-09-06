/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractSavingsAccountCharge,
  FineractSavingsAccountDetail,
  FineractSavingsAccountTransaction
} from '@mifos/api-client';
import { formatTimelineActor } from '@/lib/fineract/account-timeline-display';
import { clientAccountBackLabel } from '@/lib/fineract/clients-display';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { sortByDateThenId } from '@/lib/fineract/transaction-order';

export const SAVINGS_ACCOUNT_SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'statement', label: 'Statement' },
  { id: 'charges', label: 'Charges' },
  { id: 'audit', label: 'Audit trail' }
] as const;

export type SavingsAccountSectionId = (typeof SAVINGS_ACCOUNT_SECTIONS)[number]['id'];

export const SAVINGS_ACCOUNT_DEFAULT_SECTION: SavingsAccountSectionId = 'summary';

export function savingsAccountProductName(account: FineractSavingsAccountDetail) {
  return account.productName ?? account.savingsProductName ?? `Savings account #${account.id}`;
}

export function savingsAccountClientBackLabel(account: FineractSavingsAccountDetail): string {
  return clientAccountBackLabel(account.clientName);
}

export function savingsAccountCurrencyCode(account: FineractSavingsAccountDetail): string {
  return account.currency.code ?? 'USD';
}

/** Available balance for withdrawals and transfers (matches account detail header). */
export function savingsAccountAvailableBalance(account: FineractSavingsAccountDetail): number {
  return account.summary?.availableBalance ?? account.summary?.accountBalance ?? 0;
}

export function formatSavingsAccountMoney(
  account: FineractSavingsAccountDetail,
  amount: number | undefined
) {
  return formatAccountMoney(amount, savingsAccountCurrencyCode(account));
}

export function formatSavingsAccountDate(
  value: number[] | string | undefined
): string {
  return formatFineractDateArray(value, FINERACT_LOCALE) ?? '—';
}

export function savingsAccountStatusVariant(
  code?: string
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!code) {
    return 'secondary';
  }
  if (code.includes('active')) {
    return 'default';
  }
  if (code.includes('closed') || code.includes('reject') || code.includes('withdrawn')) {
    return 'destructive';
  }
  return 'outline';
}

export function savingsAccountAllowsOverdraft(account: FineractSavingsAccountDetail): boolean {
  return account.allowOverdraft === true;
}

export function savingsAccountBlockedMessage(account: FineractSavingsAccountDetail): string | null {
  const sub = account.subStatus;
  if (!sub) {
    return null;
  }
  if (sub.block) {
    return 'This account is fully blocked. Deposits and withdrawals are disabled.';
  }
  if (sub.blockCredit) {
    return 'Credit transactions (deposits) are blocked on this account.';
  }
  if (sub.blockDebit) {
    return 'Debit transactions (withdrawals) are blocked on this account.';
  }
  return null;
}

export function isSavingsAccountTransfer(
  transaction: FineractSavingsAccountTransaction
): boolean {
  return Boolean(transaction.transfer);
}

export function formatSavingsTransactionType(transaction: FineractSavingsAccountTransaction) {
  if (isSavingsAccountTransfer(transaction)) {
    return isSavingsTransactionDebit(transaction) ? 'Outward Transfer' : 'Inward Transfer';
  }
  return transaction.transactionType?.value ?? 'Transaction';
}

/** Business date when present; otherwise submitted date. */
export function savingsTransactionDate(
  transaction: FineractSavingsAccountTransaction
): number[] | string | undefined {
  return transaction.date ?? transaction.submittedOnDate;
}

/** Newest first: transaction date, then id. */
export function sortSavingsAccountTransactions(
  transactions: readonly FineractSavingsAccountTransaction[]
): FineractSavingsAccountTransaction[] {
  return sortByDateThenId(transactions, savingsTransactionDate, (transaction) => transaction.id);
}

/** Debit column — matches Fineract `transactionType.isDebit()` and legacy `isDebit`. */
export function isSavingsTransactionDebit(transaction: FineractSavingsAccountTransaction) {
  const type = transaction.transactionType;
  if (type) {
    if (type.debit === true) {
      return true;
    }
    if (type.credit === true) {
      return false;
    }
    if (
      type.withdrawal === true ||
      type.feeDeduction === true ||
      type.overdraftInterest === true ||
      type.withholdTax === true
    ) {
      return true;
    }
    if (type.deposit === true || type.interestPosting === true) {
      return false;
    }
    const code = type.code?.toLowerCase() ?? '';
    const value = type.value?.toLowerCase() ?? '';
    if (code.includes('release') || value.includes('release')) {
      return false;
    }
    if (code.includes('hold') || value.includes('hold')) {
      return true;
    }
  }
  const entryCode = transaction.entryType?.code?.toUpperCase();
  return entryCode === 'DEBIT';
}

/** Cash deposit — excludes account transfers (share purchase, loan repayment, etc.). */
export function isPureSavingsDeposit(transaction: FineractSavingsAccountTransaction): boolean {
  return (
    !isSavingsAccountTransfer(transaction) && transaction.transactionType?.deposit === true
  );
}

/** Cash withdrawal — excludes account transfers. */
export function isPureSavingsWithdrawal(transaction: FineractSavingsAccountTransaction): boolean {
  return (
    !isSavingsAccountTransfer(transaction) && transaction.transactionType?.withdrawal === true
  );
}

export type SavingsCashMovementTotals = {
  totalDeposits: number;
  totalWithdrawals: number;
  totalInwardTransfers: number;
  totalOutwardTransfers: number;
};

/**
 * Cash and transfer totals from transaction history.
 * Fineract `summary.totalWithdrawals` / `totalDeposits` include account transfers;
 * this separates customer cash movements from inward/outward transfers.
 */
export function sumSavingsCashMovementTotals(
  transactions: FineractSavingsAccountTransaction[]
): SavingsCashMovementTotals {
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalInwardTransfers = 0;
  let totalOutwardTransfers = 0;

  for (const transaction of transactions) {
    if (transaction.reversed) {
      continue;
    }
    const amount = transaction.amount ?? 0;
    if (isSavingsAccountTransfer(transaction)) {
      if (isSavingsTransactionDebit(transaction)) {
        totalOutwardTransfers += amount;
      } else {
        totalInwardTransfers += amount;
      }
      continue;
    }
    if (transaction.transactionType?.deposit === true) {
      totalDeposits += amount;
    } else if (transaction.transactionType?.withdrawal === true) {
      totalWithdrawals += amount;
    }
  }

  return {
    totalDeposits,
    totalWithdrawals,
    totalInwardTransfers,
    totalOutwardTransfers
  };
}

export function isSavingsTransactionAccrual(transaction: FineractSavingsAccountTransaction) {
  const type = transaction.transactionType;
  if (!type) {
    return false;
  }
  if (type.accrual === true) {
    return true;
  }
  return type.code?.toLowerCase().includes('accrual') === true;
}

export function savingsTransactionRowClassName(
  transaction: FineractSavingsAccountTransaction
): string | undefined {
  if (transaction.reversed) {
    return 'line-through opacity-60';
  }
  if (transaction.transfer) {
    return 'text-primary';
  }
  if (isSavingsTransactionAccrual(transaction)) {
    return 'text-muted-foreground italic';
  }
  return undefined;
}

export function savingsTransactionCurrencyCode(
  transaction: FineractSavingsAccountTransaction,
  account?: FineractSavingsAccountDetail
): string {
  return transaction.currency?.code ?? (account ? savingsAccountCurrencyCode(account) : 'USD');
}

export function formatSavingsTransactionPaymentDetail(
  transaction: FineractSavingsAccountTransaction
): string {
  const payment = transaction.paymentDetailData;
  if (!payment) {
    return '—';
  }
  const parts = [
    payment.paymentType?.name,
    payment.accountNumber,
    payment.receiptNumber,
    payment.checkNumber
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

export function isSavingsTransactionCredit(transaction: FineractSavingsAccountTransaction) {
  const code = transaction.entryType?.code?.toUpperCase();
  return code === 'CREDIT';
}

export function formatSavingsChargeStatus(charge: FineractSavingsAccountCharge) {
  if (charge.isWaived) {
    return 'Waived';
  }
  if (charge.isPaid) {
    return 'Paid';
  }
  if (charge.isActive === false) {
    return 'Inactive';
  }
  if ((charge.amountOutstanding ?? 0) > 0) {
    return 'Outstanding';
  }
  return 'Active';
}

const SAVINGS_STATUS = {
  pending: 'savingsAccountStatusType.submitted.and.pending.approval',
  approved: 'savingsAccountStatusType.approved',
  active: 'savingsAccountStatusType.active'
} as const;

export interface SavingsAccountActionVisibility {
  approve: boolean;
  activate: boolean;
  reject: boolean;
  withdrawnByApplicant: boolean;
  undoApproval: boolean;
  deposit: boolean;
  withdraw: boolean;
  close: boolean;
  block: boolean;
  unblock: boolean;
  blockCredit: boolean;
  unblockCredit: boolean;
  blockDebit: boolean;
  unblockDebit: boolean;
  calculateInterest: boolean;
  postInterest: boolean;
  postInterestAsOn: boolean;
  addCharge: boolean;
  applyAnnualFees: boolean;
  holdAmount: boolean;
  transferFunds: boolean;
  assignStaff: boolean;
  reassignStaff: boolean;
  enableWithholdTax: boolean;
  disableWithholdTax: boolean;
  deleteAccount: boolean;
}

export function savingsAccountAnnualFeeCharge(
  account: FineractSavingsAccountDetail
): FineractSavingsAccountCharge | undefined {
  return account.charges?.find((charge) => {
    const code = charge.chargeTimeType?.code?.toLowerCase() ?? '';
    const value = charge.chargeTimeType?.value?.toLowerCase() ?? '';
    return code.includes('annual') || value.includes('annual');
  });
}

export function savingsAccountActionVisibility(
  account: FineractSavingsAccountDetail
): SavingsAccountActionVisibility {
  const code = account.status.code ?? '';
  const pending = code === SAVINGS_STATUS.pending;
  const approved = code === SAVINGS_STATUS.approved;
  const active = code === SAVINGS_STATUS.active || account.status.active === true;
  const sub = account.subStatus;
  const blockAll = sub?.block === true;
  const blockCredit = sub?.blockCredit === true;
  const blockDebit = sub?.blockDebit === true;
  const canTransact = active && !blockAll;
  const hasFieldOfficer = Boolean(account.fieldOfficerId || account.fieldOfficerName?.trim());
  const annualFeeCharge = savingsAccountAnnualFeeCharge(account);

  return {
    approve: pending,
    activate: approved,
    reject: pending,
    withdrawnByApplicant: pending,
    undoApproval: approved,
    deposit: canTransact && !blockCredit,
    withdraw: canTransact && !blockDebit,
    close: active,
    block: active && !blockAll,
    unblock: active && blockAll,
    blockCredit: active && !blockAll && !blockCredit,
    unblockCredit: active && blockCredit,
    blockDebit: active && !blockAll && !blockDebit,
    unblockDebit: active && blockDebit,
    calculateInterest: canTransact,
    postInterest: canTransact,
    postInterestAsOn: canTransact,
    addCharge: pending || approved || active,
    applyAnnualFees: active && Boolean(annualFeeCharge),
    holdAmount: canTransact,
    transferFunds: canTransact && !blockDebit && Boolean(account.clientId),
    assignStaff: (pending || approved || active) && !hasFieldOfficer,
    reassignStaff: (pending || approved || active) && hasFieldOfficer,
    enableWithholdTax: active && Boolean(account.taxGroup?.id) && account.withHoldTax !== true,
    disableWithholdTax: active && Boolean(account.taxGroup?.id) && account.withHoldTax === true,
    deleteAccount: pending
  };
}

export function savingsAccountTimelineName(timeline: FineractSavingsAccountDetail['timeline']) {
  return formatTimelineActor({
    firstname: timeline?.submittedByFirstname,
    lastname: timeline?.submittedByLastname,
    username: timeline?.submittedByUsername
  });
}

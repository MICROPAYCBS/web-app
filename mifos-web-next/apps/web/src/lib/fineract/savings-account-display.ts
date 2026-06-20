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
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';

export const SAVINGS_ACCOUNT_SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'charges', label: 'Charges' }
] as const;

export type SavingsAccountSectionId = (typeof SAVINGS_ACCOUNT_SECTIONS)[number]['id'];

export const SAVINGS_ACCOUNT_DEFAULT_SECTION: SavingsAccountSectionId = 'summary';

export function savingsAccountProductName(account: FineractSavingsAccountDetail) {
  return account.productName ?? account.savingsProductName ?? `Savings account #${account.id}`;
}

export function savingsAccountClientBackLabel(account: FineractSavingsAccountDetail): string {
  const name = account.clientName?.trim();
  return name ? `Back to ${name}` : 'Back to customer';
}

export function savingsAccountCurrencyCode(account: FineractSavingsAccountDetail): string {
  return account.currency.code ?? 'USD';
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

export function formatSavingsTransactionType(transaction: FineractSavingsAccountTransaction) {
  return transaction.transactionType?.value ?? 'Transaction';
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

  return {
    approve: pending,
    activate: approved,
    reject: pending,
    withdrawnByApplicant: pending,
    undoApproval: approved,
    deposit: active && !blockAll && !blockCredit,
    withdraw: active && !blockAll && !blockDebit,
    close: active,
    block: active && !blockAll,
    unblock: active && blockAll,
    blockCredit: active && !blockAll && !blockCredit,
    unblockCredit: active && blockCredit,
    blockDebit: active && !blockAll && !blockDebit,
    unblockDebit: active && blockDebit
  };
}

export function savingsAccountTimelineName(timeline: FineractSavingsAccountDetail['timeline']) {
  if (!timeline) {
    return undefined;
  }
  const first = timeline.submittedByFirstname?.trim();
  const last = timeline.submittedByLastname?.trim();
  if (first || last) {
    return [first, last].filter(Boolean).join(' ');
  }
  return timeline.submittedByUsername;
}

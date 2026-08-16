/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractShareAccountDetail,
  FineractShareAccountTransaction
} from '@mifos/api-client';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';
import { sortByDateThenId } from '@/lib/fineract/transaction-order';

export const SHARE_ACCOUNT_SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'purchases', label: 'Purchased shares' },
  { id: 'charges', label: 'Charges' },
  { id: 'dividends', label: 'Dividends' },
  { id: 'audit', label: 'Audit trail' }
] as const;

export type ShareAccountSectionId = (typeof SHARE_ACCOUNT_SECTIONS)[number]['id'];

export const SHARE_ACCOUNT_DEFAULT_SECTION: ShareAccountSectionId = 'summary';

export function shareAccountProductName(account: FineractShareAccountDetail) {
  return account.productName ?? `Share account #${account.id}`;
}

export function shareAccountClientBackLabel(account: FineractShareAccountDetail): string {
  const name = account.clientName?.trim();
  return name ? `Back to ${name}` : 'Back to customer';
}

export function shareAccountCurrencyCode(account: FineractShareAccountDetail): string {
  return account.currency.code ?? account.summary?.currency?.code ?? 'USD';
}

export function shareAccountLinkedSavingsLabel(
  account: FineractShareAccountDetail
): string | null {
  if (account.savingsAccountNumber?.trim()) {
    return account.savingsAccountNumber.trim();
  }
  if (account.savingsAccountId != null && account.savingsAccountId > 0) {
    return `#${account.savingsAccountId}`;
  }
  return null;
}

export function shareAccountLinkedSavingsId(
  account: FineractShareAccountDetail
): number | undefined {
  return account.savingsAccountId != null && account.savingsAccountId > 0
    ? account.savingsAccountId
    : undefined;
}

export function formatShareAccountMoney(
  account: FineractShareAccountDetail,
  amount: number | undefined
) {
  return formatAccountMoney(amount, shareAccountCurrencyCode(account));
}

export function formatShareAccountDate(value: number[] | string | undefined): string {
  return formatFineractDateArray(value, FINERACT_LOCALE) ?? '—';
}

/** Newest first: purchased date, then id. */
export function sortShareAccountTransactions(
  transactions: readonly FineractShareAccountTransaction[]
): FineractShareAccountTransaction[] {
  return sortByDateThenId(
    transactions,
    (transaction) => transaction.purchasedDate,
    (transaction) => transaction.id
  );
}

export function shareAccountStatusVariant(
  status?: FineractShareAccountDetail['status']
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (!status) {
    return 'secondary';
  }
  if (status.active) {
    return 'default';
  }
  if (status.closed || status.rejected) {
    return 'destructive';
  }
  return 'outline';
}

/** PurchasedSharesStatusType.APPLIED = 100 — pending approval for additional shares. */
export function isPendingSharePurchase(transaction: FineractShareAccountTransaction): boolean {
  const id = transaction.status?.id;
  if (id === 100) {
    return true;
  }
  const code = transaction.status?.code?.toLowerCase() ?? '';
  const value = transaction.status?.value?.toLowerCase() ?? '';
  return code.includes('applied') || value.includes('pending');
}

export function pendingSharePurchases(
  account: FineractShareAccountDetail
): FineractShareAccountTransaction[] {
  return (account.purchasedShares ?? []).filter(isPendingSharePurchase);
}

export interface ShareAccountActionVisibility {
  approve: boolean;
  activate: boolean;
  reject: boolean;
  undoApproval: boolean;
  modify: boolean;
  close: boolean;
  applyAdditional: boolean;
  approveAdditional: boolean;
  rejectAdditional: boolean;
  redeem: boolean;
}

export function shareAccountActionVisibility(
  account: FineractShareAccountDetail
): ShareAccountActionVisibility {
  const status = account.status;
  const pending = status.submittedAndPendingApproval === true;
  const approved = status.approved === true && status.active !== true;
  const active = status.active === true;
  const hasPendingPurchases = pendingSharePurchases(account).length > 0;

  return {
    approve: pending,
    reject: pending,
    modify: pending,
    undoApproval: approved,
    activate: approved,
    applyAdditional: active,
    approveAdditional: active && hasPendingPurchases,
    rejectAdditional: active && hasPendingPurchases,
    redeem: active,
    close: active
  };
}

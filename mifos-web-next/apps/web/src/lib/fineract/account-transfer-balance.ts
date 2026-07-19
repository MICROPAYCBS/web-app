/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { AccountTransferTemplate, FineractSavingsAccountDetail } from '@mifos/api-client';
import { savingsAccountAvailableBalance } from '@/lib/fineract/savings-account-display';

export function accountTransferAvailableBalance(template: AccountTransferTemplate): number {
  const fromAccount = template.fromAccount as
    | (NonNullable<AccountTransferTemplate['fromAccount']> & {
        accountBalance?: number;
        balance?: number;
      })
    | undefined;
  if (!fromAccount) {
    return 0;
  }
  return (
    fromAccount.availableBalance ??
    fromAccount.summary?.availableBalance ??
    fromAccount.summary?.accountBalance ??
    fromAccount.accountBalance ??
    fromAccount.balance ??
    0
  );
}

/** Prefer savings account summary (matches savings detail); fall back to transfer template. */
export function resolveAccountTransferSourceAvailableBalance(
  template: AccountTransferTemplate,
  savingsAccount?: FineractSavingsAccountDetail | null
): number {
  if (savingsAccount) {
    return savingsAccountAvailableBalance(savingsAccount);
  }
  return accountTransferAvailableBalance(template);
}

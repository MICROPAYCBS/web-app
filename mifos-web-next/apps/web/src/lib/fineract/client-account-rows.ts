/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientLoanAccount, FineractClientSavingsAccount } from '@mifos/api-client';
import type { ClientAccountRow } from '@/components/clients/detail/client-accounts-table';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';

export function toLoanAccountRows(accounts: FineractClientLoanAccount[]): ClientAccountRow[] {
  return accounts.map((account) => ({
    id: account.id,
    accountNo: account.accountNo,
    productName: account.productName,
    statusLabel: account.status?.value,
    statusCode: account.status?.code,
    balanceLabel: formatAccountMoney(account.loanBalance, account.currency?.code),
    extraLabel: account.inArrears ? 'In arrears' : account.productType === 'working-capital' ? 'Working capital' : undefined
  }));
}

export function toSavingsAccountRows(accounts: FineractClientSavingsAccount[]): ClientAccountRow[] {
  return accounts.map((account) => ({
    id: account.id,
    accountNo: account.accountNo,
    productName: account.productName,
    statusLabel: account.status?.value,
    statusCode: account.status?.code,
    balanceLabel: formatAccountMoney(account.accountBalance, account.currency?.code)
  }));
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind } from '@mifos/api-client';
import type { PermissionInput } from '@mifos/auth';
import type { ClientAccountProductKind } from '@/lib/fineract/client-account-links';

export type ClientDepositAccountConfig = {
  kind: ClientDepositAccountKind;
  listKind: ClientAccountProductKind;
  apiPath: string;
  permission: PermissionInput;
  sheetTitle: string;
  sheetDescription: string;
  submitLabel: string;
};

export const CLIENT_DEPOSIT_ACCOUNT_CONFIG: Record<
  ClientDepositAccountKind,
  ClientDepositAccountConfig
> = {
  savings: {
    kind: 'savings',
    listKind: 'savings',
    apiPath: 'savingsaccounts',
    permission: 'CREATE_SAVINGSACCOUNT',
    sheetTitle: 'New savings account',
    sheetDescription: 'Submit a savings account application for this client.',
    submitLabel: 'Submit'
  },
  fixedDeposit: {
    kind: 'fixedDeposit',
    listKind: 'fixedDeposit',
    apiPath: 'fixeddepositaccounts',
    permission: 'CREATE_FIXEDDEPOSITACCOUNT',
    sheetTitle: 'New fixed deposit account',
    sheetDescription: 'Submit a fixed deposit application for this client.',
    submitLabel: 'Submit'
  },
  recurringDeposit: {
    kind: 'recurringDeposit',
    listKind: 'recurringDeposit',
    apiPath: 'recurringdepositaccounts',
    permission: 'CREATE_RECURRINGDEPOSITACCOUNT',
    sheetTitle: 'New recurring deposit account',
    sheetDescription: 'Submit a recurring deposit application for this client.',
    submitLabel: 'Submit'
  }
};

export function clientDepositAccountCreatePath(
  clientId: string | number,
  kind: ClientDepositAccountKind
): string {
  const config = CLIENT_DEPOSIT_ACCOUNT_CONFIG[kind];
  return `/clients/${clientId}/${config.listKind === 'savings' ? 'savings' : config.listKind === 'fixedDeposit' ? 'fixed-deposits' : 'recurring-deposits'}?create=1`;
}

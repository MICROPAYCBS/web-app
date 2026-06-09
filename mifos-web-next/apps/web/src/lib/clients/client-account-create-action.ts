/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import type { PermissionInput } from '@mifos/auth';
import {
  clientAccountCreatePath,
  type ClientAccountProductKind
} from '@/lib/fineract/client-account-links';
import { clientDepositAccountCreatePath } from '@/lib/fineract/client-deposit-account-config';
import { clientStatusKind } from '@/lib/fineract/client-status';

const CREATE_BY_KIND: Record<
  ClientAccountProductKind,
  { label: string; permission: PermissionInput }
> = {
  loan: { label: 'New loan account', permission: 'CREATE_LOAN' },
  savings: { label: 'New savings account', permission: 'CREATE_SAVINGSACCOUNT' },
  share: { label: 'New share account', permission: 'CREATE_SHAREACCOUNT' },
  recurringDeposit: {
    label: 'New recurring deposit account',
    permission: 'CREATE_RECURRINGDEPOSITACCOUNT'
  },
  fixedDeposit: {
    label: 'New fixed deposit account',
    permission: 'CREATE_FIXEDDEPOSITACCOUNT'
  }
};

export type ClientAccountCreateAction = {
  href: string;
  label: string;
  permission: PermissionInput;
};

/** Create CTA for account list tabs (active clients only, legacy Applications submenu). */
export function clientAccountCreateAction(
  clientId: string,
  kind: ClientAccountProductKind,
  client: Pick<FineractClientDetail, 'status'>
): ClientAccountCreateAction | undefined {
  if (clientStatusKind(client) !== 'active') {
    return undefined;
  }

  const copy = CREATE_BY_KIND[kind];
  const href =
    kind === 'loan'
      ? clientAccountCreatePath(clientId, kind)
      : kind === 'savings' || kind === 'fixedDeposit' || kind === 'recurringDeposit'
        ? clientDepositAccountCreatePath(clientId, kind)
        : clientAccountCreatePath(clientId, kind);

  return {
    href,
    label: copy.label,
    permission: copy.permission
  };
}

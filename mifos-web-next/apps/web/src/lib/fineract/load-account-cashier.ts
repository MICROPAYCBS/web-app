import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import type { AccountCashierKind, AccountCashierSnapshot } from '@/lib/fineract/cashier-display';
import { loadCurrentUserAccountCashier } from '@/lib/fineract/current-user-cashier';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import type { ServerSession } from '@/lib/session/types';

export async function loadAccountCashierForSession(
  session: ServerSession | null,
  options: {
    accountId: number;
    accountKind: AccountCashierKind;
    currencyCode: string;
  }
): Promise<AccountCashierSnapshot | null> {
  if (!session) {
    return null;
  }

  const result = await tryFineractLoad(
    () =>
      loadCurrentUserAccountCashier({
        userId: session.userId,
        officeId: session.officeId,
        accountId: options.accountId,
        accountKind: options.accountKind,
        currencyCode: options.currencyCode,
        canOpenCashierDetail: can(session, resolvePermission('organization.tellers'))
      }),
    'Could not load cashier session.'
  );

  if (!result.ok || !result.data) {
    return null;
  }

  return result.data;
}

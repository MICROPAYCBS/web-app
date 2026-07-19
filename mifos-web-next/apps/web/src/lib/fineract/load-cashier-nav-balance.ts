import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CashierNavBalance } from '@/lib/fineract/cashier-display';
import { canOpenCashierDetail } from '@/lib/fineract/cashier-access';
import { loadCurrentUserCashierNavBalance } from '@/lib/fineract/current-user-cashier';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import type { ServerSession } from '@/lib/session/types';

/** Signed-in user's teller cash position — not tied to any account route. */
export async function loadCashierNavBalanceForSession(
  session: ServerSession | null
): Promise<CashierNavBalance | null> {
  if (!session || !canOpenCashierDetail(session)) {
    return null;
  }

  const result = await tryFineractLoad(
    () =>
      loadCurrentUserCashierNavBalance({
        userId: session.userId,
        officeId: session.officeId,
        canOpenCashierDetail: true
      }),
    'Could not load cashier balance.'
  );

  if (!result.ok || !result.data) {
    return null;
  }

  return result.data;
}

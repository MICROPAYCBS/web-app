import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import type { SavingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-actions';
import type { getServerSession } from '@/lib/session/server';

export function savingsTransactionActionPermissions(
  session: Awaited<ReturnType<typeof getServerSession>>
): SavingsTransactionActionPermissions {
  return {
    undoTransaction:
      can(session, 'ADJUSTTRANSACTION_SAVINGSACCOUNT') ||
      can(session, 'UNDOTRANSACTION_SAVINGSACCOUNT'),
    undoTransfer: can(session, 'ADJUST_ACCOUNTTRANSFER'),
    modifyTransaction: can(session, 'ADJUSTTRANSACTION_SAVINGSACCOUNT'),
    viewJournal: can(session, resolvePermission('accounting.journal'))
  };
}

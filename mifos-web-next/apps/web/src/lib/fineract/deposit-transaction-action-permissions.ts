import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import type { DepositTransactionActionPermissions } from '@/lib/fineract/deposit-transaction-actions';
import type { getServerSession } from '@/lib/session/server';

/**
 * Fineract / Angular use savings transaction permissions for FD/RD portfolio undos
 * (`UNDOTRANSACTION_SAVINGSACCOUNT` / `ADJUSTTRANSACTION_SAVINGSACCOUNT`).
 */
export function depositTransactionActionPermissions(
  session: Awaited<ReturnType<typeof getServerSession>>
): DepositTransactionActionPermissions {
  return {
    undoTransaction:
      can(session, 'ADJUSTTRANSACTION_SAVINGSACCOUNT') ||
      can(session, 'UNDOTRANSACTION_SAVINGSACCOUNT'),
    viewJournal: can(session, resolvePermission('accounting.journal'))
  };
}

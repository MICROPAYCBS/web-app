import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import type { LoanTransactionActionPermissions } from '@/lib/fineract/loan-transaction-actions';
import type { getServerSession } from '@/lib/session/server';

export function loanTransactionActionPermissions(
  session: Awaited<ReturnType<typeof getServerSession>>
): LoanTransactionActionPermissions {
  return {
    undoTransaction: can(session, 'ADJUST_LOAN'),
    undoWriteOff: can(session, 'UNDOWRITEOFF_LOAN'),
    viewJournal: can(session, resolvePermission('accounting.journal'))
  };
}

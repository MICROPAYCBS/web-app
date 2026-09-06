/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import type { DepositAccountActionPermissions } from '@/components/clients/accounts/actions/deposit-account-actions';
import type { AccountOfficerPermissions } from '@/components/clients/accounts/actions/account-officer-actions';
import {
  depositAccountPermission,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import type { getServerSession } from '@/lib/session/server';

type Session = Awaited<ReturnType<typeof getServerSession>>;

export function termDepositOfficerPermissions(session: Session): AccountOfficerPermissions {
  return {
    assign: can(session, 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT'),
    reassign: can(session, {
      all: ['UPDATESAVINGSOFFICER_SAVINGSACCOUNT', 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT']
    })
  };
}

export function termDepositLifecyclePermissions(
  session: Session,
  kind: TermDepositAccountKind
): DepositAccountActionPermissions {
  return {
    approve: can(session, depositAccountPermission(kind, 'APPROVE')),
    activate: can(session, depositAccountPermission(kind, 'ACTIVATE')),
    reject: can(session, depositAccountPermission(kind, 'REJECT')),
    withdrawnByApplicant: can(session, depositAccountPermission(kind, 'WITHDRAW')),
    undoApproval: can(session, depositAccountPermission(kind, 'APPROVALUNDO')),
    undoActivation: can(session, depositAccountPermission(kind, 'UNDO_ACTIVATE')),
    prematureClose: can(session, depositAccountPermission(kind, 'PREMATURECLOSE')),
    close: can(session, depositAccountPermission(kind, 'CLOSE')),
    calculateInterest: can(session, depositAccountPermission(kind, 'CALCULATEINTEREST')),
    postInterest: can(session, depositAccountPermission(kind, 'POSTINTEREST')),
    deposit: can(session, depositAccountPermission(kind, 'DEPOSIT')),
    withdrawal: can(session, depositAccountPermission(kind, 'WITHDRAWAL')),
    deleteAccount: can(session, depositAccountPermission(kind, 'DELETE')),
    addCharge: can(session, 'CREATE_SAVINGSACCOUNTCHARGE'),
    modifyApplication: can(session, depositAccountPermission(kind, 'UPDATE')),
    officer: termDepositOfficerPermissions(session)
  };
}

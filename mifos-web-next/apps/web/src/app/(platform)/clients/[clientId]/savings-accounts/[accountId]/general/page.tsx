/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SavingsAccountDetailView } from '@/components/clients/savings/savings-account-detail-view';
import type { SavingsAccountActionPermissions } from '@/components/clients/savings/actions/savings-account-actions';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import {
  CLIENT_ACCOUNT_RESERVED_IDS,
  clientGeneralPath
} from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { listAuditTrailsForSavingsAccount } from '@/lib/fineract/audit-trails';
import { savingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-action-permissions';
import { getSavingsAccount } from '@/lib/fineract/savings-accounts';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

function savingsAccountPermissions(session: Awaited<ReturnType<typeof getServerSession>>): SavingsAccountActionPermissions {
  return {
    approve: can(session, 'APPROVE_SAVINGSACCOUNT'),
    activate: can(session, 'ACTIVATE_SAVINGSACCOUNT'),
    reject: can(session, 'REJECT_SAVINGSACCOUNT'),
    withdrawnByApplicant: can(session, 'WITHDRAW_SAVINGSACCOUNT'),
    undoApproval: can(session, 'APPROVALUNDO_SAVINGSACCOUNT'),
    deposit: can(session, 'DEPOSIT_SAVINGSACCOUNT'),
    withdraw: can(session, 'WITHDRAWAL_SAVINGSACCOUNT'),
    close: can(session, 'CLOSE_SAVINGSACCOUNT'),
    block: can(session, 'BLOCK_SAVINGSACCOUNT'),
    unblock: can(session, 'UNBLOCK_SAVINGSACCOUNT'),
    blockCredit: can(session, 'BLOCKCREDIT_SAVINGSACCOUNT'),
    unblockCredit: can(session, 'UNBLOCKCREDIT_SAVINGSACCOUNT'),
    blockDebit: can(session, 'BLOCKDEBIT_SAVINGSACCOUNT'),
    unblockDebit: can(session, 'UNBLOCKDEBIT_SAVINGSACCOUNT'),
    calculateInterest: can(session, 'CALCULATEINTEREST_SAVINGSACCOUNT'),
    postInterest: can(session, 'POSTINTEREST_SAVINGSACCOUNT'),
    postInterestAsOn: can(session, 'POSTINTEREST_SAVINGSACCOUNT'),
    addCharge: can(session, 'CREATE_SAVINGSACCOUNTCHARGE'),
    applyAnnualFees: can(session, 'APPLYANNUALFEE_SAVINGSACCOUNT'),
    holdAmount: can(session, 'HOLDAMOUNT_SAVINGSACCOUNT'),
    transferFunds: can(session, 'CREATE_ACCOUNTTRANSFER'),
    assignStaff: can(session, 'UPDATESAVINGSOFFICER_SAVINGSACCOUNT'),
    reassignStaff: can(session, {
      all: ['UPDATESAVINGSOFFICER_SAVINGSACCOUNT', 'REMOVESAVINGSOFFICER_SAVINGSACCOUNT']
    }),
    enableWithholdTax: can(session, 'UPDATEWITHHOLDTAX_SAVINGSACCOUNT'),
    disableWithholdTax: can(session, 'UPDATEWITHHOLDTAX_SAVINGSACCOUNT'),
    deleteAccount: can(session, 'DELETE_SAVINGSACCOUNT')
  };
}

export default async function SavingsAccountGeneralPage({
  params
}: {
  params: Promise<{ clientId: string; accountId: string }>;
}) {
  const { clientId, accountId } = await params;
  const session = await getServerSession();
  const canViewAudits = can(session, resolvePermission('system.audit'));

  if (CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {
    notFound();
  }

  const [result, auditResult] = await Promise.all([
    tryFineractLoad(() => getSavingsAccount(accountId), 'Could not load savings account.'),
    canViewAudits
      ? tryFineractLoad(
          () => listAuditTrailsForSavingsAccount(accountId),
          'Could not load audit trail.'
        )
      : Promise.resolve(null)
  ]);

  if (!result.ok) {
    return (
      <ListPage
        backLink={
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <DetailBackLink href={clientGeneralPath(clientId)} label="Back to customer" />
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <DetailBackLink
              href={clientAccountListPath(clientId, 'savings')}
              label="Savings accounts"
            />
          </div>
        }
        title="Savings account"
      >
        <LoadErrorAlert title="Could not load savings account" message={result.message} />
      </ListPage>
    );
  }

  if (!result.data) {
    notFound();
  }

  const auditEntries =
    auditResult?.ok && auditResult.data ? auditResult.data.pageItems : [];
  const auditTotalRecords =
    auditResult?.ok && auditResult.data ? auditResult.data.totalFilteredRecords : undefined;

  return (
    <Suspense fallback={null}>
      <SavingsAccountDetailView
        account={result.data}
        clientId={clientId}
        permissions={savingsAccountPermissions(session)}
        canViewAudits={canViewAudits}
        auditEntries={auditEntries}
        auditLoadFailed={auditResult != null && !auditResult.ok}
        auditTotalRecords={auditTotalRecords}
        transactionActionPermissions={savingsTransactionActionPermissions(session)}
      />
    </Suspense>
  );
}

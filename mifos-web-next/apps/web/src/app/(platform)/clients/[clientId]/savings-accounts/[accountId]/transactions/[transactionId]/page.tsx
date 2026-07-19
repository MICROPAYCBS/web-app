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
import { SavingsAccountTransactionDetailView } from '@/components/clients/savings/savings-account-transaction-detail-view';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import { savingsJournalTransactionId } from '@/lib/accounting/journal-entry-links';
import { CLIENT_ACCOUNT_RESERVED_IDS } from '@/lib/fineract/client-action-paths';
import { savingsAccountSectionPath } from '@/lib/fineract/client-account-links';
import { listAuditTrailsForSavingsTransaction } from '@/lib/fineract/audit-trails';
import { getJournalEntryTransaction } from '@/lib/fineract/journal-entries';
import { getSavingsAccount, getSavingsAccountTransaction } from '@/lib/fineract/savings-accounts';
import { loadReportOrganisationName } from '@/lib/fineract/load-report-organisation-name';
import { savingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-action-permissions';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function SavingsAccountTransactionPage({
  params
}: {
  params: Promise<{ clientId: string; accountId: string; transactionId: string }>;
}) {
  const { clientId, accountId, transactionId } = await params;
  const session = await getServerSession();
  const canViewJournal = can(session, resolvePermission('accounting.journal'));
  const canViewAudits = can(session, resolvePermission('system.audit'));
  const journalTransactionId = savingsJournalTransactionId(transactionId);

  if (
    CLIENT_ACCOUNT_RESERVED_IDS.has(accountId) ||
    CLIENT_ACCOUNT_RESERVED_IDS.has(transactionId)
  ) {
    notFound();
  }

  const [accountResult, transactionResult, reportOrgName] = await Promise.all([
    tryFineractLoad(() => getSavingsAccount(accountId), 'Could not load savings account.'),
    tryFineractLoad(
      () => getSavingsAccountTransaction(accountId, transactionId),
      'Could not load transaction.'
    ),
    loadReportOrganisationName()
  ]);

  if (!accountResult.ok || !transactionResult.ok) {
    const message = !accountResult.ok
      ? accountResult.message
      : !transactionResult.ok
        ? transactionResult.message
        : 'Could not load transaction.';

    return (
      <ListPage
        backLink={
          <DetailBackLink
            href={savingsAccountSectionPath(clientId, accountId, 'transactions')}
            label="Back to transactions"
          />
        }
        title="Transaction"
      >
        <LoadErrorAlert title="Could not load transaction" message={message} />
      </ListPage>
    );
  }

  if (!accountResult.data || !transactionResult.data) {
    notFound();
  }

  let journalEntries: Awaited<ReturnType<typeof getJournalEntryTransaction>>['pageItems'] = [];
  let journalLoadFailed = false;
  if (canViewJournal) {
    const journalResult = await tryFineractLoad(
      () => getJournalEntryTransaction(journalTransactionId),
      'Could not load ledger entries.'
    );
    if (journalResult.ok && journalResult.data) {
      journalEntries = journalResult.data.pageItems;
    } else {
      journalLoadFailed = !journalResult.ok;
      journalEntries = [];
    }
  }

  let auditEntries: Awaited<ReturnType<typeof listAuditTrailsForSavingsTransaction>>['pageItems'] =
    [];
  let auditLoadFailed = false;
  if (canViewAudits) {
    const auditResult = await tryFineractLoad(
      () => listAuditTrailsForSavingsTransaction(accountId, transactionId),
      'Could not load audit trail.'
    );
    if (auditResult.ok && auditResult.data) {
      auditEntries = auditResult.data.pageItems;
    } else {
      auditLoadFailed = !auditResult.ok;
      auditEntries = [];
    }
  }

  return (
    <Suspense fallback={null}>
      <SavingsAccountTransactionDetailView
        account={accountResult.data}
        transaction={transactionResult.data}
        clientId={clientId}
        reportOrgName={reportOrgName}
        canViewJournal={canViewJournal}
        journalTransactionId={journalTransactionId}
        journalEntries={journalEntries}
        journalLoadFailed={journalLoadFailed}
        canViewAudits={canViewAudits}
        auditEntries={auditEntries}
        auditLoadFailed={auditLoadFailed}
        transactionActionPermissions={savingsTransactionActionPermissions(session)}
      />
    </Suspense>
  );
}

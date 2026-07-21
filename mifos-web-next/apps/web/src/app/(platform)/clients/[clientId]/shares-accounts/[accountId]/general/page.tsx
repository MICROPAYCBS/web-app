/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ShareAccountDetailView } from '@/components/clients/shares/share-account-detail-view';
import type { ShareAccountActionPermissions } from '@/components/clients/shares/actions/share-account-actions';
import { DetailBackLink } from '@/components/composites';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { ListPage } from '@/components/composites/list-page';
import {
  CLIENT_ACCOUNT_RESERVED_IDS,
  clientGeneralPath
} from '@/lib/fineract/client-action-paths';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { listAuditTrailsForShareAccount } from '@/lib/fineract/audit-trails';
import { getShareAccount } from '@/lib/fineract/share-accounts';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

function shareAccountPermissions(
  session: Awaited<ReturnType<typeof getServerSession>>
): ShareAccountActionPermissions {
  return {
    approve: can(session, 'APPROVE_SHAREACCOUNT'),
    activate: can(session, 'ACTIVATE_SHAREACCOUNT'),
    reject: can(session, 'REJECT_SHAREACCOUNT'),
    undoApproval: can(session, 'APPROVALUNDO_SHAREACCOUNT'),
    modify: can(session, 'UPDATE_SHAREACCOUNT'),
    close: can(session, 'CLOSE_SHAREACCOUNT'),
    applyAdditional: can(session, 'APPLYADDITIONAL_SHAREACCOUNT'),
    approveAdditional: can(session, 'APPROVEADDITIONAL_SHAREACCOUNT'),
    rejectAdditional: can(session, 'REJECTADDITIONAL_SHAREACCOUNT'),
    redeem: can(session, 'REDEEMSHARES_SHAREACCOUNT')
  };
}

export default async function ShareAccountGeneralPage({
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
    tryFineractLoad(() => getShareAccount(accountId), 'Could not load share account.'),
    tryFineractLoad(
      () => listAuditTrailsForShareAccount(accountId, { limit: canViewAudits ? 100 : 25 }),
      'Could not load audit trail.'
    )
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
              href={clientAccountListPath(clientId, 'share')}
              label="Share accounts"
            />
          </div>
        }
        title="Share account"
      >
        <LoadErrorAlert title="Could not load share account" message={result.message} />
      </ListPage>
    );
  }

  if (!result.data) {
    notFound();
  }

  const auditEntries =
    canViewAudits && auditResult?.ok && auditResult.data ? auditResult.data.pageItems : [];
  const auditTotalRecords =
    auditResult?.ok && auditResult.data ? auditResult.data.totalFilteredRecords : undefined;

  return (
    <ShareAccountDetailView
      account={result.data}
      clientId={clientId}
      permissions={shareAccountPermissions(session)}
      canViewAudits={canViewAudits}
      auditEntries={auditEntries}
      auditLoadFailed={canViewAudits && auditResult != null && !auditResult.ok}
      auditTotalRecords={auditTotalRecords}
    />
  );
}

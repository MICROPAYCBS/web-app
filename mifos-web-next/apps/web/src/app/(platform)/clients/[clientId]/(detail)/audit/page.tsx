/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { ClientAuditView } from '@/components/clients/detail/client-audit-view';
import { EmptyState } from '@/components/composites';
import { ScrollText } from 'lucide-react';
import { listAuditTrailsForClient } from '@/lib/fineract/audit-trails';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

export default async function ClientAuditPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const session = await getServerSession();
  const canViewAudits = can(session, resolvePermission('system.audit'));

  if (!canViewAudits) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Audit trail unavailable"
        description="You do not have permission to view audit entries."
      />
    );
  }

  const auditResult = await tryFineractLoad(
    () => listAuditTrailsForClient(clientId),
    'Could not load audit trail.'
  );

  const audits = auditResult.ok && auditResult.data ? auditResult.data.pageItems : [];
  const totalRecords =
    auditResult.ok && auditResult.data ? auditResult.data.totalFilteredRecords : undefined;

  return (
    <ClientAuditView
      audits={audits}
      loadFailed={!auditResult.ok}
      totalRecords={totalRecords}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { ClientDetailShell } from '@/components/clients/detail/client-detail-shell';
import { ClientDetailShellSkeleton } from '@/components/clients/detail/client-detail-skeleton';
import { buildClientDatatableNavItems } from '@/lib/fineract/client-datatable-nav';
import { getClientProfileImage, clientHasProfileImage } from '@/lib/fineract/client-image';
import { getClientSignatureInfo } from '@/lib/fineract/client-signature';
import { loadApprovalWorkflowRuntimeContext } from '@/lib/checker-inbox/approval-workflow-runtime';
import { listAuditTrailsForClient } from '@/lib/fineract/audit-trails';
import {
  loadResourcePendingCheckerActions,
  resolveResourcePendingWorkflowContext
} from '@/lib/fineract/resource-pending-checker';
import { clientPendingCheckerScope } from '@/lib/fineract/resource-pending-checker-display';
import { LoadErrorAlert } from '@/components/composites/load-error-alert';
import { PlatformRouteLayout } from '@/components/platform/platform-route-layout';
import { getClient } from '@/lib/fineract/clients';
import { tryFineractLoad } from '@/lib/fineract/safe-load';
import { getServerSession } from '@/lib/session/server';

async function ClientDetailLayoutBody({
  children,
  clientId
}: {
  children: ReactNode;
  clientId: string;
}) {
  const session = await getServerSession();

  const clientResult = await tryFineractLoad(
    () => getClient(clientId),
    'Could not load this customer.'
  );

  if (!clientResult.ok) {
    if (clientResult.status === 404) {
      notFound();
    }
    return (
      <PlatformRouteLayout className="p-4 md:p-6">
        <LoadErrorAlert title="Customer unavailable" message={clientResult.message} />
      </PlatformRouteLayout>
    );
  }

  const client = clientResult.data;

  const [profileImageSrc, signatureInfo, datatableNavItems, auditResult, workflowRuntime] =
    await Promise.all([
    clientHasProfileImage(client)
      ? getClientProfileImage(clientId).catch(() => null)
      : Promise.resolve(null),
    getClientSignatureInfo(clientId).catch(() => ({
      hasSignature: false,
      documentId: undefined
    })),
    buildClientDatatableNavItems(clientId, client, session),
    tryFineractLoad(
      () => listAuditTrailsForClient(clientId, { limit: 25 }),
      'Could not load audit trail.'
    ),
    loadApprovalWorkflowRuntimeContext()
  ]);

  const auditEntriesForPending =
    auditResult?.ok && auditResult.data ? auditResult.data.pageItems : [];
  const pendingCheckerActions = await loadResourcePendingCheckerActions(
    clientPendingCheckerScope(client.id),
    auditEntriesForPending
  );
  const pendingApprovalWorkflowContext = await resolveResourcePendingWorkflowContext(
    pendingCheckerActions,
    clientPendingCheckerScope(client.id),
    { status: client.status },
    workflowRuntime
  );

  const canCreateImage = can(session, 'CREATE_CLIENTIMAGE');
  const canDeleteImage = can(session, 'DELETE_CLIENTIMAGE');

  return (
    <ClientDetailShell
      client={client}
      initialImageSrc={profileImageSrc}
      canCreateImage={canCreateImage}
      canDeleteImage={canDeleteImage}
      hasSignature={signatureInfo.hasSignature}
      signatureDocumentId={signatureInfo.documentId}
      datatableNavItems={datatableNavItems}
      pendingCheckerActions={pendingCheckerActions}
      pendingApprovalWorkflowContext={pendingApprovalWorkflowContext}
      makerCheckerTaskPermissions={workflowRuntime.makerCheckerPermissions}
    >
      {children}
    </ClientDetailShell>
  );
}

export default async function ClientDetailLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <PlatformRouteLayout>
      <Suspense fallback={<ClientDetailShellSkeleton />}>
        <ClientDetailLayoutBody clientId={clientId}>{children}</ClientDetailLayoutBody>
      </Suspense>
    </PlatformRouteLayout>
  );
}

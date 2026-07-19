/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail, FineractRolePermissionUsage } from '@mifos/api-client';
import { Suspense, type ReactNode } from 'react';
import { ClientEditUrlPanel } from '@/components/clients/edit/client-edit-url-panel';
import type { ClientDatatableNavItem } from '@/lib/fineract/client-datatable-nav';
import { ClientDetailNav } from '@/components/clients/detail/client-detail-nav';
import { ClientDetailTop } from '@/components/clients/detail/client-detail-top';
import { ClientTransferBanner } from '@/components/clients/detail/client-transfer-banner';
import { ResourcePendingCheckerBanner } from '@/components/composites/resource-pending-checker-banner';
import { DetailPage } from '@/components/composites';
import { clientStatusKind, isClientUnderTransfer } from '@/lib/fineract/client-status';
import { clientPendingCheckerScope } from '@/lib/fineract/resource-pending-checker-display';
import type { ResourcePendingWorkflowContext } from '@/lib/fineract/resource-pending-checker';
import type { ResourcePendingCheckerAction } from '@/lib/fineract/resource-pending-checker-display';

export function ClientDetailShell({
  client,
  initialImageSrc,
  canCreateImage,
  canDeleteImage,
  hasSignature = false,
  signatureDocumentId,
  datatableNavItems = [],
  pendingCheckerActions = [],
  pendingApprovalWorkflowContext,
  makerCheckerTaskPermissions = [],
  children
}: {
  client: FineractClientDetail;
  initialImageSrc: string | null;
  canCreateImage: boolean;
  canDeleteImage: boolean;
  hasSignature?: boolean;
  signatureDocumentId?: number;
  datatableNavItems?: ClientDatatableNavItem[];
  pendingCheckerActions?: ResourcePendingCheckerAction[];
  pendingApprovalWorkflowContext?: ResourcePendingWorkflowContext;
  makerCheckerTaskPermissions?: FineractRolePermissionUsage[];
  children: ReactNode;
}) {
  const status = clientStatusKind(client);
  const showTransferBanner = isClientUnderTransfer(status);

  return (
    <DetailPage
      header={
        <ClientDetailTop
          client={client}
          initialImageSrc={initialImageSrc}
          canCreateImage={canCreateImage}
          canDeleteImage={canDeleteImage}
          hasSignature={hasSignature}
          signatureDocumentId={signatureDocumentId}
          pendingCheckerActions={pendingCheckerActions}
        />
      }
      sidebar={<ClientDetailNav clientId={client.id} datatableNavItems={datatableNavItems} />}
    >
      {showTransferBanner ? (
        <ClientTransferBanner clientId={client.id} clientStatus={status} />
      ) : null}
      <ResourcePendingCheckerBanner
        scope={clientPendingCheckerScope(client.id)}
        actions={pendingCheckerActions}
        approvalWorkflowContext={pendingApprovalWorkflowContext}
        taskPermissions={makerCheckerTaskPermissions}
        status={client.status}
      />
      {children}
      <Suspense fallback={null}>
        <ClientEditUrlPanel clientId={String(client.id)} />
      </Suspense>
    </DetailPage>
  );
}

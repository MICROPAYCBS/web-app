/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { Suspense, type ReactNode } from 'react';
import { ClientEditUrlPanel } from '@/components/clients/edit/client-edit-url-panel';
import type { ClientDatatableNavItem } from '@/lib/fineract/client-datatable-nav';
import { ClientDetailNav } from '@/components/clients/detail/client-detail-nav';
import { ClientDetailTop } from '@/components/clients/detail/client-detail-top';
import { ClientTransferBanner } from '@/components/clients/detail/client-transfer-banner';
import { DetailPage } from '@/components/composites';
import { clientStatusKind, isClientUnderTransfer } from '@/lib/fineract/client-status';

export function ClientDetailShell({
  client,
  initialImageSrc,
  canCreateImage,
  canDeleteImage,
  hasSignature = false,
  signatureDocumentId,
  datatableNavItems = [],
  children
}: {
  client: FineractClientDetail;
  initialImageSrc: string | null;
  canCreateImage: boolean;
  canDeleteImage: boolean;
  hasSignature?: boolean;
  signatureDocumentId?: number;
  datatableNavItems?: ClientDatatableNavItem[];
  children: ReactNode;
}) {
  const status = clientStatusKind(client);
  const showTransferBanner = isClientUnderTransfer(status);

  return (
    <DetailPage
      className="min-h-0 flex-1"
      header={
        <ClientDetailTop
          client={client}
          initialImageSrc={initialImageSrc}
          canCreateImage={canCreateImage}
          canDeleteImage={canDeleteImage}
          hasSignature={hasSignature}
          signatureDocumentId={signatureDocumentId}
        />
      }
      sidebar={<ClientDetailNav clientId={client.id} datatableNavItems={datatableNavItems} />}
    >
      {showTransferBanner ? (
        <ClientTransferBanner clientId={client.id} clientStatus={status} />
      ) : null}
      {children}
      <Suspense fallback={null}>
        <ClientEditUrlPanel clientId={String(client.id)} />
      </Suspense>
    </DetailPage>
  );
}

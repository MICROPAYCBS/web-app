/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import type { ReactNode } from 'react';
import { ClientDetailNav } from '@/components/clients/detail/client-detail-nav';
import { ClientDetailTop } from '@/components/clients/detail/client-detail-top';
import { DetailPage } from '@/components/composites';

export function ClientDetailShell({
  client,
  initialImageSrc,
  canCreateImage,
  canDeleteImage,
  children
}: {
  client: FineractClientDetail;
  initialImageSrc: string | null;
  canCreateImage: boolean;
  canDeleteImage: boolean;
  children: ReactNode;
}) {
  return (
    <DetailPage
      header={
        <ClientDetailTop
          client={client}
          initialImageSrc={initialImageSrc}
          canCreateImage={canCreateImage}
          canDeleteImage={canDeleteImage}
        />
      }
      sidebar={<ClientDetailNav clientId={client.id} />}
    >
      {children}
    </DetailPage>
  );
}

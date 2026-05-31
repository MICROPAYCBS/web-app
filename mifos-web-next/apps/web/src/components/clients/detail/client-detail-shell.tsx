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
import { DetailHeader, DetailPage, DetailSummary, TextValue } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { clientDisplayName } from '@/lib/fineract/clients-display';

export function ClientDetailShell({
  client,
  children
}: {
  client: FineractClientDetail;
  children: ReactNode;
}) {
  const name = clientDisplayName(client);

  return (
    <DetailPage
      header={
        <DetailHeader
          title={name}
          status={{
            label: client.status?.value ?? 'Unknown',
            variant: 'secondary'
          }}
          meta={
            <span>
              Account {client.accountNo}
              {client.officeName ? ` · ${client.officeName}` : ''}
              {client.staffName ? ` · ${client.staffName}` : ''}
            </span>
          }
          actions={
            <Button type="button" variant="outline" disabled>
              Actions
            </Button>
          }
        />
      }
      summary={
        <DetailSummary
          items={[
            {
              id: 'status',
              label: 'Status',
              value: <TextValue value={client.status?.value} />
            },
            {
              id: 'external',
              label: 'External ID',
              value: <TextValue value={client.externalId} />
            }
          ]}
        />
      }
      sidebar={<ClientDetailNav clientId={client.id} />}
    >
      {children}
    </DetailPage>
  );
}

// Re-export for tests or config
export { clientDetailNavGroups } from '@/components/clients/detail/client-detail-nav';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import type { ReactNode } from 'react';
import {
  DetailHeader,
  DetailNavTabs,
  DetailPage,
  DetailSummary,
  TextValue,
  type DetailNavTab
} from '@/components/composites';
import { Button } from '@/components/ui/button';
import { clientDisplayName } from '@/lib/fineract/clients-display';

export function clientDetailTabs(clientId: string | number): DetailNavTab[] {
  const base = `/clients/${clientId}`;
  return [
    { id: 'general', label: 'General', href: `${base}/general` },
    { id: 'loans', label: 'Loans', href: `${base}/loans` },
    { id: 'savings', label: 'Savings', href: `${base}/savings` },
    { id: 'fixed-deposits', label: 'Fixed deposits', href: `${base}/fixed-deposits` },
    { id: 'relations', label: 'Many to one', href: `${base}/relations` }
  ];
}

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
      tabs={<DetailNavTabs tabs={clientDetailTabs(client.id)} />}
    >
      {children}
    </DetailPage>
  );
}

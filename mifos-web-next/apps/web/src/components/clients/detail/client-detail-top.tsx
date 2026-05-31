/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ClientProfileAvatar } from '@/components/clients/detail/client-profile-avatar';
import { DetailHeader, DetailSummary } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { clientDisplayName } from '@/lib/fineract/clients-display';
import { TextValue } from '@/components/composites';

export function ClientDetailTop({
  client,
  initialImageSrc,
  canCreateImage,
  canDeleteImage,
  summary
}: {
  client: FineractClientDetail;
  initialImageSrc: string | null;
  canCreateImage: boolean;
  canDeleteImage: boolean;
  summary?: ReactNode;
}) {
  const name = clientDisplayName(client);

  return (
    <div className="space-y-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to clients
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ClientProfileAvatar
          client={client}
          initialImageSrc={initialImageSrc}
          canCreateImage={canCreateImage}
          canDeleteImage={canDeleteImage}
        />

        <div className="min-w-0 flex-1 space-y-4">
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

          {summary ?? (
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
          )}
        </div>
      </div>
    </div>
  );
}

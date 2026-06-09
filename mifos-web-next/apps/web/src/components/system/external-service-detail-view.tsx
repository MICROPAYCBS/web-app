'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalServiceProperty } from '@mifos/api-client';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DetailBackLink, DetailHeader, DetailPage } from '@/components/composites';
import { ExternalServiceConfigTable } from '@/components/system/external-service-config-table';
import { ExternalServiceEditSheet } from '@/components/system/external-service-edit-sheet';
import { Button } from '@/components/ui/button';
import {
  type ExternalServiceDefinition,
  externalServiceListPath
} from '@/lib/fineract/external-service-display';

export function ExternalServiceDetailView({
  definition,
  properties,
  canUpdate
}: {
  definition: ExternalServiceDefinition;
  properties: FineractExternalServiceProperty[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href={externalServiceListPath()} label="Back to external services" />
            }
            title={definition.title}
            meta={definition.description}
            actions={
              canUpdate ? (
                <Button type="button" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Button>
              ) : null
            }
          />
        }
      >
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <ExternalServiceConfigTable definition={definition} properties={properties} />
        </div>
      </DetailPage>

      {canUpdate ? (
        <ExternalServiceEditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          definition={definition}
          properties={properties}
          onSaved={() => router.refresh()}
        />
      ) : null}
    </>
  );
}

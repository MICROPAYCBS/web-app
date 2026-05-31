/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FineractHttpError } from '@mifos/api-client';
import {
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection,
  DetailSummary,
  TextValue
} from '@/components/composites';
import { Button } from '@/components/ui/button';
import { clientDisplayName } from '@/lib/fineract/clients-display';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { getClient } from '@/lib/fineract/clients';

export default async function ClientDetailPage({
  params
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  let client;
  try {
    client = await getClient(clientId);
  } catch (err) {
    if (err instanceof FineractHttpError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const name = clientDisplayName(client);
  const submittedLabel = formatFineractDateArray(client.timeline?.submittedOnDate);
  const activatedLabel = formatFineractDateArray(client.timeline?.activatedOnDate);
  const dobLabel = formatFineractDateArray(client.dateOfBirth);

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
    >
      <DetailSection title="Identifiers">
        <DetailFieldGrid>
          <DetailField label="Client ID">
            <TextValue value={String(client.id)} />
          </DetailField>
          <DetailField label="Account no.">
            <TextValue value={client.accountNo} />
          </DetailField>
          <DetailField label="Office">
            <TextValue value={client.officeName} />
          </DetailField>
          <DetailField label="Staff">
            <TextValue value={client.staffName} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Contact">
        <DetailFieldGrid>
          <DetailField label="Mobile">
            <TextValue value={client.mobileNo} />
          </DetailField>
          <DetailField label="Email">
            <TextValue value={client.emailAddress} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Dates">
        <DetailFieldGrid>
          <DetailField label="Submitted on">
            <TextValue value={submittedLabel} />
          </DetailField>
          <DetailField label="Activated on">
            <TextValue value={activatedLabel} />
          </DetailField>
          <DetailField label="Date of birth">
            <TextValue value={dobLabel} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <p className="text-sm text-muted-foreground">
        <Link href="/clients" className="underline underline-offset-4">
          Back to clients
        </Link>
      </p>
    </DetailPage>
  );
}

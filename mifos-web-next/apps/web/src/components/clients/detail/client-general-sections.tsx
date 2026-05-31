/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  TextValue
} from '@/components/composites';
import { formatFineractDateArray } from '@/lib/fineract/dates';

export function ClientGeneralSections({ client }: { client: FineractClientDetail }) {
  const submittedLabel = formatFineractDateArray(client.timeline?.submittedOnDate);
  const activatedLabel = formatFineractDateArray(client.timeline?.activatedOnDate);
  const dobLabel = formatFineractDateArray(client.dateOfBirth);

  return (
    <>
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

      <DetailSection title="Personal">
        <DetailFieldGrid>
          {client.firstname ? (
            <DetailField label="First name">
              <TextValue value={client.firstname} />
            </DetailField>
          ) : null}
          {client.middlename ? (
            <DetailField label="Middle name">
              <TextValue value={client.middlename} />
            </DetailField>
          ) : null}
          {client.lastname ? (
            <DetailField label="Last name">
              <TextValue value={client.lastname} />
            </DetailField>
          ) : null}
          {client.fullname ? (
            <DetailField label="Entity name">
              <TextValue value={client.fullname} />
            </DetailField>
          ) : null}
          <DetailField label="Gender">
            <TextValue value={client.gender?.name ?? client.gender?.value} />
          </DetailField>
          <DetailField label="Client type">
            <TextValue value={client.clientType?.name ?? client.clientType?.value} />
          </DetailField>
          <DetailField label="Classification">
            <TextValue
              value={client.clientClassification?.name ?? client.clientClassification?.value}
            />
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

    </>
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { SectorDisplayValue } from '@/components/clients/shared/sector-display-value';
import { ClientFinancialSummarySection } from '@/components/clients/detail/client-financial-summary';
import { DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';
import {
  enumOptionLabel,
  formatYesNo,
  isClientEntity
} from '@/lib/fineract/client-detail-labels';
import type { ClientFinancialSummary } from '@/lib/fineract/client-financial-summary';
import { formatFineractDateArray } from '@/lib/fineract/dates';

function ClientInformationSection({ client }: { client: FineractClientDetail }) {
  const isEntity = isClientEntity(client);
  const constructedName = [client.firstname, client.middlename, client.lastname]
    .filter(Boolean)
    .join(' ')
    .trim();
  const apiDisplayName = client.displayName?.trim();
  const showDisplayName =
    Boolean(apiDisplayName) &&
    Boolean(constructedName) &&
    apiDisplayName !== constructedName;

  return (
    <DetailSection title="Customer information">
      <DetailFieldGrid>
        {showDisplayName ? (
          <DetailField label="Display name">
            <TextValue value={client.displayName} />
          </DetailField>
        ) : null}
        <DetailField label="Legal form">
          <TextValue value={enumOptionLabel(client.legalForm)} />
        </DetailField>
        {!isEntity && client.firstname ? (
          <DetailField label="First name">
            <TextValue value={client.firstname} />
          </DetailField>
        ) : null}
        {!isEntity && client.middlename ? (
          <DetailField label="Middle name">
            <TextValue value={client.middlename} />
          </DetailField>
        ) : null}
        {!isEntity && client.lastname ? (
          <DetailField label="Last name">
            <TextValue value={client.lastname} />
          </DetailField>
        ) : null}
        {isEntity && client.fullname ? (
          <DetailField label="Entity name">
            <TextValue value={client.fullname} />
          </DetailField>
        ) : null}
        {!isEntity ? (
          <DetailField label="Gender">
            <TextValue value={enumOptionLabel(client.gender)} />
          </DetailField>
        ) : null}
        {!isEntity ? (
          <DetailField label="Is staff">
            <TextValue value={formatYesNo(client.isStaff)} />
          </DetailField>
        ) : null}
        <DetailField label="Account number">
          <TextValue value={client.accountNo} />
        </DetailField>
        <DetailField label="External ID">
          <TextValue value={client.externalId} />
        </DetailField>
        <DetailField label="Branch">
          <TextValue value={client.officeName} />
        </DetailField>
        <DetailField label="Relationship officer">
          <TextValue value={client.staffName} />
        </DetailField>
        {client.savingsAccountId != null ? (
          <DetailField label="Default savings account">
            <TextValue
              value={
                client.savingsProductName
                  ? `${client.savingsProductName} (${client.savingsAccountId})`
                  : String(client.savingsAccountId)
              }
            />
          </DetailField>
        ) : null}
        <DetailField label="Mobile number">
          <TextValue value={client.mobileNo} />
        </DetailField>
        <DetailField label="Alternative mobile number">
          <TextValue value={client.alternativeMobileNo} />
        </DetailField>
        <DetailField label="Email">
          <TextValue value={client.emailAddress} />
        </DetailField>
        <DetailField label="Alternative email">
          <TextValue value={client.alternativeEmailAddress} />
        </DetailField>
        <DetailField label="Tax identification number (TIN)">
          <TextValue value={client.taxIdentificationNumber} />
        </DetailField>
        {client.subIndustryId != null ? (
          <DetailField label="Sector / industry / sub-industry">
            <SectorDisplayValue subIndustryId={client.subIndustryId} />
          </DetailField>
        ) : null}
        <DetailField label="Customer type">
          <TextValue value={enumOptionLabel(client.clientType)} />
        </DetailField>
        <DetailField label="Classification">
          <TextValue value={enumOptionLabel(client.clientClassification)} />
        </DetailField>
      </DetailFieldGrid>
    </DetailSection>
  );
}

function ClientEntityDetailsSection({ client }: { client: FineractClientDetail }) {
  const details = client.clientNonPersonDetails;
  if (!isClientEntity(client) || !details) {
    return null;
  }

  const hasAnyField =
    details.constitution ||
    details.mainBusinessLine ||
    details.incorpNumber ||
    details.incorpValidityTillDate ||
    details.remarks;

  if (!hasAnyField) {
    return null;
  }

  return (
    <DetailSection title="Entity details">
      <DetailFieldGrid>
        <DetailField label="Constitution">
          <TextValue value={enumOptionLabel(details.constitution)} />
        </DetailField>
        <DetailField label="Main business line">
          <TextValue value={enumOptionLabel(details.mainBusinessLine)} />
        </DetailField>
        <DetailField label="Incorporation number">
          <TextValue value={details.incorpNumber} />
        </DetailField>
        <DetailField label="Incorporation valid until">
          <TextValue value={formatFineractDateArray(details.incorpValidityTillDate)} />
        </DetailField>
        {details.remarks ? (
          <DetailField label="Remarks" className="sm:col-span-2">
            <TextValue value={details.remarks} />
          </DetailField>
        ) : null}
      </DetailFieldGrid>
    </DetailSection>
  );
}

function ClientGroupMembershipSection({ client }: { client: FineractClientDetail }) {
  const groups = client.groups?.filter((group) => group.name?.trim()) ?? [];
  if (groups.length === 0) {
    return null;
  }

  return (
    <DetailSection title="Group membership">
      <DetailFieldGrid>
        {groups.map((group) => (
          <DetailField key={group.id} label={group.accountNo ? `Group ${group.accountNo}` : 'Group'}>
            <TextValue value={group.name} />
          </DetailField>
        ))}
      </DetailFieldGrid>
    </DetailSection>
  );
}

export function ClientGeneralSections({
  client,
  financialSummary
}: {
  client: FineractClientDetail;
  financialSummary: ClientFinancialSummary;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <ClientInformationSection client={client} />
        <ClientEntityDetailsSection client={client} />
        <ClientGroupMembershipSection client={client} />
      </div>

      <ClientFinancialSummarySection summary={financialSummary} />
    </div>
  );
}

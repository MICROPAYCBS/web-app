/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientComplianceProfile, FineractClientDetail, FineractClientIncomeSource } from '@mifos/api-client';
import Link from 'next/link';
import { SectorDisplayValue } from '@/components/clients/shared/sector-display-value';
import { formatIncomeSourceSummary } from '@/components/clients/detail/client-income-source-sections';
import { ClientFinancialSummarySection } from '@/components/clients/detail/client-financial-summary';
import { DetailField, DetailFieldGrid, DetailSection, TextValue } from '@/components/composites';
import {
  enumOptionLabel,
  formatYesNo,
  isClientEntity
} from '@/lib/fineract/client-detail-labels';
import type { ClientFinancialSummary } from '@/lib/fineract/client-financial-summary';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { formatCustomerClassLabel } from '@/lib/fineract/customer-class-eligibility';

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
        <DetailField label="Profile type">
          <TextValue value={enumOptionLabel(client.legalForm)} />
        </DetailField>
        {!isEntity ? (
          <DetailField label="Title">
            <TextValue value={enumOptionLabel(client.title)} />
          </DetailField>
        ) : null}
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
          <DetailField label="Nationality">
            <TextValue value={enumOptionLabel(client.nationality)} />
          </DetailField>
        ) : null}
        {!isEntity ? (
          <DetailField label="Gender">
            <TextValue value={enumOptionLabel(client.gender)} />
          </DetailField>
        ) : null}
        <DetailField label="Customer number">
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
        {!isEntity ? (
          <DetailField label="Is staff">
            <TextValue value={formatYesNo(client.isStaff)} />
          </DetailField>
        ) : null}
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
          <DetailField label="Sub-industry">
            <SectorDisplayValue subIndustryId={client.subIndustryId} />
          </DetailField>
        ) : null}
        <DetailField label="Customer type">
          <TextValue value={enumOptionLabel(client.clientType)} />
        </DetailField>
        <DetailField label="Customer class">
          <TextValue value={formatCustomerClassLabel(client.customerClass) ?? 'Not assigned'} />
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

function ClientIncomeSourceSummarySection({
  clientId,
  incomeSources
}: {
  clientId: string;
  incomeSources: FineractClientIncomeSource[];
}) {
  if (incomeSources.length === 0) {
    return null;
  }

  const primary =
    incomeSources.find((source) => source.isPrimarySource) ?? incomeSources[0];
  const sourceOfFundsLabel = primary.sourceOfFunds;
  const monthlyIncome =
    primary.monthlyIncome != null
      ? `${primary.incomeCurrencyCode ? `${primary.incomeCurrencyCode} ` : ''}${primary.monthlyIncome.toLocaleString()}`
      : undefined;

  return (
    <DetailSection title="Income">
      <DetailFieldGrid>
        <DetailField label="Primary income source">
          <TextValue value={formatIncomeSourceSummary(primary)} />
        </DetailField>
        {sourceOfFundsLabel ? (
          <DetailField label="Source of funds">
            <TextValue value={sourceOfFundsLabel} />
          </DetailField>
        ) : null}
        {primary.employerBusinessName ? (
          <DetailField label="Employer / business">
            <TextValue value={primary.employerBusinessName} />
          </DetailField>
        ) : null}
        {primary.employerAddress ? (
          <DetailField label="Employer address" className="sm:col-span-2">
            <TextValue value={primary.employerAddress} />
          </DetailField>
        ) : null}
        {primary.occupation ? (
          <DetailField label="Occupation">
            <TextValue value={primary.occupation} />
          </DetailField>
        ) : null}
        {monthlyIncome ? (
          <DetailField label="Monthly income">
            <TextValue value={monthlyIncome} />
          </DetailField>
        ) : null}
        {primary.subIndustryId != null ? (
          <DetailField label="Sub-industry">
            <SectorDisplayValue subIndustryId={primary.subIndustryId} />
          </DetailField>
        ) : null}
        {primary.verificationStatus ? (
          <DetailField label="Verification">
            <TextValue value={primary.verificationStatus} />
          </DetailField>
        ) : null}
        {incomeSources.length > 1 ? (
          <DetailField label="All income sources">
            <Link
              href={`/clients/${clientId}/income-sources`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              View all ({incomeSources.length})
            </Link>
          </DetailField>
        ) : null}
      </DetailFieldGrid>
    </DetailSection>
  );
}

function ClientComplianceSummarySection({
  clientId,
  profile
}: {
  clientId: string;
  profile: FineractClientComplianceProfile | null;
}) {
  if (!profile) {
    return null;
  }

  const accounts = profile.otherBankAccounts ?? [];
  const hasAny =
    profile.hasOtherBankAccounts ||
    profile.isPep ||
    profile.usCitizenOrResident ||
    profile.fatcaRegistered ||
    profile.dpfAlternativeBankName ||
    profile.dpfAlternativeAccountNumber ||
    accounts.length > 0;

  if (!hasAny) {
    return null;
  }

  return (
    <DetailSection title="Compliance">
      <DetailFieldGrid>
        {profile.hasOtherBankAccounts ? (
          <DetailField label="Other bank accounts">
            <TextValue
              value={
                accounts[0]
                  ? [accounts[0].bankName, accounts[0].accountNumber].filter(Boolean).join(' · ')
                  : 'Yes'
              }
            />
          </DetailField>
        ) : null}
        {profile.isPep ? (
          <DetailField label="PEP">
            <TextValue value={profile.pepPosition || 'Yes'} />
          </DetailField>
        ) : null}
        {profile.fatcaRegistered ? (
          <DetailField label="FATCA">
            <TextValue value={profile.fatcaRegistrationNo || 'Registered'} />
          </DetailField>
        ) : null}
        {profile.dpfAlternativeBankName ? (
          <DetailField label="DPF alternative bank">
            <TextValue value={profile.dpfAlternativeBankName} />
          </DetailField>
        ) : null}
        <DetailField label="Full compliance profile">
          <Link
            href={`/clients/${clientId}/compliance-profile`}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View details
          </Link>
        </DetailField>
      </DetailFieldGrid>
    </DetailSection>
  );
}

function ClientBankUseSection({ client }: { client: FineractClientDetail }) {
  return (
    <DetailSection title="Bank use">
      <DetailFieldGrid>
        <DetailField label="Customer risk profile">
          <TextValue value={enumOptionLabel(client.customerRiskProfile) ?? 'Not assigned'} />
        </DetailField>
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
  financialSummary,
  incomeSources = [],
  complianceProfile = null
}: {
  client: FineractClientDetail;
  financialSummary: ClientFinancialSummary;
  incomeSources?: FineractClientIncomeSource[];
  complianceProfile?: FineractClientComplianceProfile | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <ClientInformationSection client={client} />
        <ClientIncomeSourceSummarySection clientId={String(client.id)} incomeSources={incomeSources} />
        <ClientComplianceSummarySection clientId={String(client.id)} profile={complianceProfile} />
        <ClientBankUseSection client={client} />
        <ClientEntityDetailsSection client={client} />
        <ClientGroupMembershipSection client={client} />
      </div>

      <ClientFinancialSummarySection summary={financialSummary} />
    </div>
  );
}

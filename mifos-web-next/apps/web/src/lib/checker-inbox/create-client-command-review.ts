/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ClientAddressEntry,
  ClientContactInput,
  ClientIdentifierInput,
  ComplianceProfileInput,
  FamilyMemberInput,
  IncomeSourceInput
} from '@mifos/validation';
import { emptyComplianceProfile } from '@/components/clients/create/steps/compliance-profile-step';
import type {
  CreateClientDraft,
  DatatableFormValues,
  MultiRowDatatableDraft
} from '@/components/clients/create/types';

export function isCreateClientCheckerCommand(
  actionName?: string | null,
  entityName?: string | null
): boolean {
  return (
    (actionName ?? '').trim().toUpperCase() === 'CREATE' &&
    (entityName ?? '').trim().toUpperCase() === 'CLIENT'
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Parse maker-checker `commandAsJson` for CREATE CLIENT into a plain object. */
export function parseCreateClientCommandAsJson(
  commandAsJson: string | undefined | null
): Record<string, unknown> | null {
  if (!commandAsJson?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(commandAsJson) as unknown;
    return asRecord(parsed);
  } catch {
    return null;
  }
}

/** Best-effort display name from a CREATE CLIENT command payload. */
export function createClientDisplayNameFromCommandAsJson(
  commandAsJson: string | undefined | null
): string | undefined {
  const payload = parseCreateClientCommandAsJson(commandAsJson);
  if (!payload) {
    return undefined;
  }
  const fullname = asString(payload.fullname)?.trim();
  if (fullname) {
    return fullname;
  }
  const parts = [asString(payload.firstname)?.trim(), asString(payload.lastname)?.trim()].filter(
    Boolean
  ) as string[];
  return parts.length > 0 ? parts.join(' ') : undefined;
}

function mapFamilyMember(raw: unknown): FamilyMemberInput | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const firstName = asString(row.firstName)?.trim();
  const lastName = asString(row.lastName)?.trim();
  const relationshipId = asNumber(row.relationshipId);
  const genderId = asNumber(row.genderId);
  if (!firstName || !lastName || relationshipId == null || genderId == null) {
    return null;
  }
  return {
    firstName,
    middleName: asString(row.middleName),
    lastName,
    qualification: asString(row.qualification),
    mobileNumber: asString(row.mobileNumber),
    age: asNumber(row.age),
    isDependent: asBoolean(row.isDependent),
    relationshipId,
    genderId,
    professionId: asNumber(row.professionId),
    maritalStatusId: asNumber(row.maritalStatusId),
    dateOfBirth: asString(row.dateOfBirth),
    emailAddress: asString(row.emailAddress),
    address: asString(row.address)
  };
}

function mapIncomeSource(raw: unknown): IncomeSourceInput | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const incomeSourceTypeId = asNumber(row.incomeSourceTypeId);
  if (incomeSourceTypeId == null) {
    return null;
  }
  const employerBusinessName =
    asString(row.employerBusinessName) ??
    asString(row.employerName) ??
    asString(row.businessName);
  return {
    incomeSourceTypeId,
    sourceOfFundsId: asNumber(row.sourceOfFundsId),
    employerBusinessName,
    employerAddress: asString(row.employerAddress) ?? asString(row.businessAddress),
    occupation: asString(row.occupation) ?? asString(row.natureOfBusiness),
    subIndustryId: asNumber(row.subIndustryId),
    monthlyIncome:
      asNumber(row.monthlyIncome) ??
      asNumber(row.netSalary) ??
      asNumber(row.averageMonthlyIncome) ??
      asNumber(row.monthlyTurnover),
    incomeCurrencyCode: asString(row.incomeCurrencyCode),
    incomeFrequencyId: asNumber(row.incomeFrequencyId),
    startDate: asString(row.startDate) ?? asString(row.businessStartDate),
    endDate: asString(row.endDate),
    isPrimarySource: asBoolean(row.isPrimarySource) ?? asBoolean(row.isPrimary),
    verificationStatusId: asNumber(row.verificationStatusId),
    supportingDocument: asString(row.supportingDocument),
    remarks: asString(row.remarks) ?? asString(row.description),
    status: asString(row.status),
    dateFormat: asString(row.dateFormat),
    locale: asString(row.locale)
  };
}

function mapIdentifier(raw: unknown): ClientIdentifierInput | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const documentTypeId = asNumber(row.documentTypeId);
  const documentKey = asString(row.documentKey);
  if (documentTypeId == null || !documentKey) {
    return null;
  }
  const statusRaw = asString(row.status)?.trim().toLowerCase();
  const status: ClientIdentifierInput['status'] =
    statusRaw === 'inactive' ? 'Inactive' : 'Active';
  return {
    documentTypeId,
    documentKey,
    description: asString(row.description),
    status
  };
}

function mapContact(raw: unknown): ClientContactInput | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  const contactTypeId = asNumber(row.contactTypeId);
  const contactValue = asString(row.contactValue);
  if (contactTypeId == null || !contactValue) {
    return null;
  }
  return {
    contactTypeId,
    contactValue,
    primary: asBoolean(row.primary) ?? false
  };
}

function mapAddress(raw: unknown): ClientAddressEntry | null {
  const row = asRecord(raw);
  if (!row) {
    return null;
  }
  return {
    addressTypeId: asNumber(row.addressTypeId),
    isActive: asBoolean(row.isActive),
    street: asString(row.street),
    addressLine1: asString(row.addressLine1),
    addressLine2: asString(row.addressLine2),
    addressLine3: asString(row.addressLine3),
    townVillage: asString(row.townVillage),
    city: asString(row.city),
    countyDistrict: asString(row.countyDistrict),
    stateProvinceId: asNumber(row.stateProvinceId),
    countryId: asNumber(row.countryId),
    postalCode: asString(row.postalCode),
    latitude: asNumber(row.latitude),
    longitude: asNumber(row.longitude),
    isPrimary: asBoolean(row.isPrimary)
  };
}

function mapComplianceProfile(raw: unknown): ComplianceProfileInput {
  const row = asRecord(raw);
  if (!row) {
    return emptyComplianceProfile();
  }
  const otherBankAccounts = asArray(row.otherBankAccounts)
    .map((account) => {
      const entry = asRecord(account);
      if (!entry) {
        return null;
      }
      const bankName = asString(entry.bankName)?.trim() ?? '';
      const accountNumber = asString(entry.accountNumber)?.trim() ?? '';
      if (!bankName && !accountNumber) {
        return null;
      }
      return {
        bankName,
        accountNumber,
        branchName: asString(entry.branchName) ?? asString(entry.branch),
        displayOrder: asNumber(entry.displayOrder),
        id: asNumber(entry.id)
      };
    })
    .filter((account): account is NonNullable<typeof account> => account != null);

  return {
    hasOtherBankAccounts: asBoolean(row.hasOtherBankAccounts) ?? otherBankAccounts.length > 0,
    isPep: asBoolean(row.isPep) ?? false,
    pepPosition: asString(row.pepPosition),
    pepRelativeName: asString(row.pepRelativeName),
    usCitizenOrResident: asBoolean(row.usCitizenOrResident) ?? false,
    fatcaRegistered: asBoolean(row.fatcaRegistered) ?? false,
    fatcaRegistrationNo: asString(row.fatcaRegistrationNo),
    dpfAlternativeBankName: asString(row.dpfAlternativeBankName),
    dpfAlternativeAccountNumber: asString(row.dpfAlternativeAccountNumber),
    otherBankAccounts
  };
}

function mapDatatables(raw: unknown): {
  datatables: DatatableFormValues;
  multiRowDatatables: MultiRowDatatableDraft;
} {
  const datatables: DatatableFormValues = {};
  const multiRowDatatables: MultiRowDatatableDraft = {};

  for (const entry of asArray(raw)) {
    const row = asRecord(entry);
    if (!row) {
      continue;
    }
    const name = asString(row.registeredTableName)?.trim();
    if (!name) {
      continue;
    }
    const data = row.data;
    if (Array.isArray(data)) {
      multiRowDatatables[name] = data
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => item != null);
      continue;
    }
    const single = asRecord(data);
    if (single) {
      datatables[name] = single;
    }
  }

  return { datatables, multiRowDatatables };
}

/**
 * Maps a CREATE CLIENT command body (POST /clients JSON) into the create-wizard draft
 * used by PreviewStep.
 */
export function createClientDraftFromCommandPayload(
  payload: Record<string, unknown>
): CreateClientDraft {
  const nonPerson = asRecord(payload.clientNonPersonDetails);
  const { datatables, multiRowDatatables } = mapDatatables(payload.datatables);

  return {
    general: {
      officeId: asNumber(payload.officeId),
      staffId: asNumber(payload.staffId),
      legalFormId: asNumber(payload.legalFormId),
      externalId: asString(payload.externalId),
      firstname: asString(payload.firstname),
      middlename: asString(payload.middlename),
      lastname: asString(payload.lastname),
      fullname: asString(payload.fullname),
      clientNonPersonDetails: nonPerson
        ? {
            constitutionId: asNumber(nonPerson.constitutionId),
            incorpValidityTillDate: asString(nonPerson.incorpValidityTillDate),
            incorpNumber: asString(nonPerson.incorpNumber),
            mainBusinessLineId: asNumber(nonPerson.mainBusinessLineId),
            remarks: asString(nonPerson.remarks)
          }
        : undefined,
      genderId: asNumber(payload.genderId),
      isStaff: asBoolean(payload.isStaff),
      mobileNo: asString(payload.mobileNo),
      emailAddress: asString(payload.emailAddress),
      taxIdentificationNumber: asString(payload.taxIdentificationNumber),
      alternativeMobileNo: asString(payload.alternativeMobileNo),
      alternativeEmailAddress: asString(payload.alternativeEmailAddress),
      subIndustryId: asNumber(payload.subIndustryId),
      customerClassId: asNumber(payload.customerClassId),
      titleId: asNumber(payload.titleId),
      nationalityCountryId: asNumber(payload.nationalityCountryId),
      maritalStatusId: asNumber(payload.maritalStatusId),
      customerRiskProfileId: asNumber(payload.customerRiskProfileId),
      dateOfBirth: asString(payload.dateOfBirth),
      clientTypeId: asNumber(payload.clientTypeId),
      submittedOnDate: asString(payload.submittedOnDate),
      savingsProductId: asNumber(payload.savingsProductId),
      dateFormat: asString(payload.dateFormat),
      locale: asString(payload.locale)
    },
    clientIdentifiers: asArray(payload.clientIdentifiers)
      .map(mapIdentifier)
      .filter((item): item is ClientIdentifierInput => item != null),
    familyMembers: asArray(payload.familyMembers)
      .map(mapFamilyMember)
      .filter((item): item is FamilyMemberInput => item != null),
    incomeSources: asArray(payload.incomeSources)
      .map(mapIncomeSource)
      .filter((item): item is IncomeSourceInput => item != null),
    contacts: asArray(payload.contacts)
      .map(mapContact)
      .filter((item): item is ClientContactInput => item != null),
    complianceProfile: mapComplianceProfile(payload.complianceProfile),
    addresses: asArray(payload.address)
      .map(mapAddress)
      .filter((item): item is ClientAddressEntry => item != null),
    datatables,
    multiRowDatatables
  };
}

export function createClientDraftFromCommandAsJson(
  commandAsJson: string | undefined | null
): CreateClientDraft | null {
  const payload = parseCreateClientCommandAsJson(commandAsJson);
  if (!payload) {
    return null;
  }
  return createClientDraftFromCommandPayload(payload);
}

/** Preferred highlight keys for CREATE CLIENT (identity / onboarding). */
export const CREATE_CLIENT_PREFERRED_COMMAND_KEYS = [
  'firstname',
  'lastname',
  'fullname',
  'mobileNo',
  'emailAddress',
  'officeId',
  'legalFormId',
  'externalId',
  'submittedOnDate',
  'dateOfBirth',
  'genderId',
  'staffId',
  'customerClassId',
  'clientTypeId'
] as const;

export function createClientCommandHighlightLimit(): number {
  return 6;
}

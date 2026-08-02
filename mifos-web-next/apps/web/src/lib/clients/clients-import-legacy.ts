/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  GENDER_FEMALE,
  GENDER_MALE,
  isValidUgandaMobileInternational,
  LEGAL_FORM_PERSON,
  normalizeUgandaMobileInternational,
  saveDraftClientSchema,
  type SaveDraftClientPayload
} from '@mifos/validation';
import {
  cellText,
  type ClientsImportLookups,
  type ClientsImportRowProgress
} from '@/lib/clients/clients-import';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField,
  parseFineractDateString,
  toFineractDate
} from '@/lib/fineract/dates';

export const CLIENTS_LEGACY_IMPORT_TEMPLATE_HINT =
  'Legacy spreadsheet for person customers without Micropay-required fields. Required: First Name and Last Name. Other columns are optional. Customers are saved as drafts under your branch office.';

export const CLIENTS_LEGACY_IMPORT_COLUMNS = [
  'First Name',
  'Last Name',
  'Middle Name',
  'Other Name',
  'Short Name',
  'Phone Number',
  'Email',
  'Operation Profile',
  'Customer Type',
  'Identification Number',
  'Date of Birth',
  'Client Tags',
  'Gender',
  'Marital Status',
  'Next of Kin Name',
  'Next of Kin Phone',
  'Position / Title',
  'Area',
  'Account Number',
  'Address Line 1',
  'City',
  'State / Province',
  'Country',
  'Postal Code',
  'Residential Address Line 1',
  'Residential Address Line 2',
  'Personal Customer Unique ID'
] as const;

export type ClientsLegacyImportColumn = (typeof CLIENTS_LEGACY_IMPORT_COLUMNS)[number];

export type ClientsLegacyImportWorkbookRawRow = {
  rowNumber: number;
  values: Partial<Record<ClientsLegacyImportColumn, unknown>>;
};

export type ClientsLegacyImportAnalyzedRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  email: string;
  customerType: string;
  identificationNumber: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  positionTitle: string;
  addressLine1: string;
  city: string;
  stateProvince: string;
  country: string;
  postalCode: string;
  residentialAddressLine1: string;
  residentialAddressLine2: string;
  externalId: string;
  errors: string[];
  warnings: string[];
};

export type ClientsLegacyImportPreparedRow = {
  rowNumber: number;
  displayName: string;
  officeName: string;
  externalId: string;
  input: SaveDraftClientPayload;
};

export type ClientsLegacyImportAnalysis = {
  rows: ClientsLegacyImportAnalyzedRow[];
  rowCount: number;
  errorRowCount: number;
  warningRowCount: number;
  canCreate: boolean;
};

export type ClientsLegacyImportRowProgress = ClientsImportRowProgress;

function normalizeKey(value: unknown): string {
  return cellText(value).replace(/\s+/g, ' ').toUpperCase();
}

function findLookup(
  options: ClientsImportLookups[keyof ClientsImportLookups],
  raw: string
) {
  const key = normalizeKey(raw);
  if (!key) {
    return undefined;
  }
  const asId = Number(raw);
  if (Number.isInteger(asId) && asId > 0) {
    const byId = options.find((option) => option.id === asId);
    if (byId) {
      return byId;
    }
  }
  return options.find(
    (option) =>
      normalizeKey(option.name) === key ||
      (option.code != null && normalizeKey(option.code) === key)
  );
}

function findGender(options: ClientsImportLookups['genders'], raw: string): number | undefined {
  const key = normalizeKey(raw);
  if (!key) {
    return undefined;
  }
  if (key === 'MALE' || key === 'M' || key === '1') {
    return GENDER_MALE;
  }
  if (key === 'FEMALE' || key === 'F' || key === '2') {
    return GENDER_FEMALE;
  }
  return findLookup(options, raw)?.id;
}

function parseDateCell(
  value: unknown,
  label: string
): { ok: true; value?: string } | { ok: false; message: string } {
  if (value instanceof Date) {
    return { ok: true, value: toFineractDate(value) };
  }
  const text = cellText(value);
  if (!text) {
    return { ok: true, value: undefined };
  }
  const normalized = normalizeFineractDateField(text);
  if (!normalized || !parseFineractDateString(normalized)) {
    return {
      ok: false,
      message: `${label} must be a valid date (e.g. ${FINERACT_DATE_FORMAT}).`
    };
  }
  return { ok: true, value: normalized };
}

function splitPersonName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: parts[0]! };
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(' ')
  };
}

const UNMAPPED_COLUMNS: ClientsLegacyImportColumn[] = [
  'Other Name',
  'Short Name',
  'Operation Profile',
  'Client Tags',
  'Area'
];

export function analyzeClientsLegacyImportRows(
  rawRows: ClientsLegacyImportWorkbookRawRow[],
  lookups: ClientsImportLookups
): ClientsLegacyImportAnalysis {
  const externalIdsInFile = new Map<string, number>();

  const rows: ClientsLegacyImportAnalyzedRow[] = rawRows.map(({ rowNumber, values }) => {
    const firstName = cellText(values['First Name']);
    const lastName = cellText(values['Last Name']);
    const middleName = cellText(values['Middle Name']);
    const phoneNumber = cellText(values['Phone Number']);
    const email = cellText(values.Email);
    const customerType = cellText(values['Customer Type']);
    const identificationNumber = cellText(values['Identification Number']);
    const gender = cellText(values.Gender);
    const maritalStatus = cellText(values['Marital Status']);
    const nextOfKinName = cellText(values['Next of Kin Name']);
    const nextOfKinPhone = cellText(values['Next of Kin Phone']);
    const positionTitle = cellText(values['Position / Title']);
    const uniqueId = cellText(values['Personal Customer Unique ID']);
    const accountNumber = cellText(values['Account Number']);
    const addressLine1 = cellText(values['Address Line 1']);
    const city = cellText(values.City);
    const stateProvince = cellText(values['State / Province']);
    const country = cellText(values.Country);
    const postalCode = cellText(values['Postal Code']);
    const residentialAddressLine1 = cellText(values['Residential Address Line 1']);
    const residentialAddressLine2 = cellText(values['Residential Address Line 2']);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!firstName) {
      errors.push('First Name is required.');
    }
    if (!lastName) {
      errors.push('Last Name is required.');
    }

    if (phoneNumber && !isValidUgandaMobileInternational(phoneNumber)) {
      errors.push('Phone Number must be a Uganda number in international format (e.g. +2567…).');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email is not valid.');
    }

    const dob = parseDateCell(values['Date of Birth'], 'Date of Birth');
    if (!dob.ok) {
      errors.push(dob.message);
    }

    if (gender) {
      const genderId = findGender(lookups.genders, gender);
      if (genderId !== GENDER_MALE && genderId !== GENDER_FEMALE) {
        errors.push(`Unknown gender "${gender}".`);
      }
    }

    if (maritalStatus && !findLookup(lookups.maritalStatuses, maritalStatus)) {
      errors.push(`Unknown marital status "${maritalStatus}".`);
    }

    if (customerType && lookups.clientTypes.length > 0 && !findLookup(lookups.clientTypes, customerType)) {
      errors.push(`Unknown customer type "${customerType}".`);
    }

    if (positionTitle && lookups.titles.length > 0 && !findLookup(lookups.titles, positionTitle)) {
      warnings.push(`Position / Title "${positionTitle}" was not matched and will be skipped.`);
    }

    if (identificationNumber && lookups.identityTypes.length === 0) {
      warnings.push(
        'Identification Number is present but no ID types are configured; it will be skipped.'
      );
    } else if (identificationNumber) {
      warnings.push(
        `Identification Number will use ID type "${lookups.identityTypes[0]?.name ?? 'default'}".`
      );
    }

    if (nextOfKinName && lookups.familyRelationships.length === 0) {
      warnings.push(
        'Next of Kin Name is present but no relationships are configured; it will be skipped.'
      );
    }

    if (nextOfKinPhone && !isValidUgandaMobileInternational(nextOfKinPhone)) {
      errors.push(
        'Next of Kin Phone must be a Uganda number in international format (e.g. +2567…).'
      );
    }

    if (country && !findLookup(lookups.countries, country)) {
      warnings.push(`Country "${country}" was not matched and will be skipped.`);
    }

    if (
      stateProvince &&
      lookups.stateProvinces.length > 0 &&
      !findLookup(lookups.stateProvinces, stateProvince)
    ) {
      warnings.push(`State / Province "${stateProvince}" was not matched and will be skipped.`);
    }

    for (const column of UNMAPPED_COLUMNS) {
      if (cellText(values[column])) {
        warnings.push(`${column} is not imported in legacy mode.`);
      }
    }

    const externalId = uniqueId || accountNumber;
    if (externalId) {
      const duplicateRow = externalIdsInFile.get(normalizeKey(externalId));
      if (duplicateRow != null) {
        errors.push(
          `Duplicate Personal Customer Unique ID / Account Number in file (also on row ${duplicateRow}).`
        );
      } else {
        externalIdsInFile.set(normalizeKey(externalId), rowNumber);
      }
    }
    if (accountNumber && !uniqueId) {
      warnings.push('Account Number is stored as external ID.');
    } else if (accountNumber && uniqueId) {
      warnings.push(
        'Account Number is not imported; Personal Customer Unique ID is used as external ID.'
      );
    }

    return {
      rowNumber,
      firstName,
      lastName,
      middleName,
      phoneNumber,
      email,
      customerType,
      identificationNumber,
      dateOfBirth: dob.ok && dob.value ? dob.value : cellText(values['Date of Birth']),
      gender,
      maritalStatus,
      nextOfKinName,
      nextOfKinPhone,
      positionTitle,
      addressLine1,
      city,
      stateProvince,
      country,
      postalCode,
      residentialAddressLine1,
      residentialAddressLine2,
      externalId,
      errors,
      warnings
    };
  });

  const errorRowCount = rows.filter((row) => row.errors.length > 0).length;
  const warningRowCount = rows.filter((row) => row.warnings.length > 0).length;

  return {
    rows,
    rowCount: rows.length,
    errorRowCount,
    warningRowCount,
    canCreate: rows.length > 0 && errorRowCount === 0
  };
}

export function prepareClientsLegacyImportRows(
  analysis: ClientsLegacyImportAnalysis,
  lookups: ClientsImportLookups,
  defaultOfficeId: number
): { ok: true; rows: ClientsLegacyImportPreparedRow[] } | { ok: false; message: string } {
  if (!analysis.canCreate) {
    return { ok: false, message: 'Fix import errors before creating customers.' };
  }
  if (!defaultOfficeId || defaultOfficeId <= 0) {
    return {
      ok: false,
      message: 'Your session has no branch office to assign imported customers to.'
    };
  }

  const officeName =
    lookups.offices.find((office) => office.id === defaultOfficeId)?.name ?? 'Your office';
  const defaultRelationship = lookups.familyRelationships[0];
  const defaultIdentityType = lookups.identityTypes[0];
  const submittedOnDate = toFineractDate();
  const prepared: ClientsLegacyImportPreparedRow[] = [];

  for (const row of analysis.rows) {
    const genderId = row.gender ? findGender(lookups.genders, row.gender) : undefined;
    const maritalOption = row.maritalStatus
      ? findLookup(lookups.maritalStatuses, row.maritalStatus)
      : undefined;
    const clientType = row.customerType
      ? findLookup(lookups.clientTypes, row.customerType)
      : undefined;
    const title = row.positionTitle ? findLookup(lookups.titles, row.positionTitle) : undefined;
    const country = row.country ? findLookup(lookups.countries, row.country) : undefined;
    const state = row.stateProvince
      ? findLookup(lookups.stateProvinces, row.stateProvince)
      : undefined;

    const hasAddress = Boolean(
      row.addressLine1 ||
        row.city ||
        row.postalCode ||
        row.residentialAddressLine1 ||
        row.residentialAddressLine2 ||
        country ||
        state
    );

    const nok = row.nextOfKinName && defaultRelationship ? splitPersonName(row.nextOfKinName) : null;
    const nokGenderId =
      genderId === GENDER_MALE || genderId === GENDER_FEMALE ? genderId : GENDER_MALE;

    const inputCandidate = {
      legalFormId: LEGAL_FORM_PERSON as typeof LEGAL_FORM_PERSON,
      officeId: defaultOfficeId,
      firstname: row.firstName,
      lastname: row.lastName,
      middlename: row.middleName || undefined,
      externalId: row.externalId || undefined,
      mobileNo: row.phoneNumber
        ? normalizeUgandaMobileInternational(row.phoneNumber)
        : undefined,
      emailAddress: row.email || undefined,
      dateOfBirth: row.dateOfBirth ? normalizeFineractDateField(row.dateOfBirth) : undefined,
      genderId:
        genderId === GENDER_MALE || genderId === GENDER_FEMALE ? genderId : undefined,
      maritalStatusId: maritalOption?.id,
      clientTypeId: clientType?.id,
      titleId: title?.id,
      submittedOnDate,
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE,
      clientIdentifiers:
        row.identificationNumber && defaultIdentityType
          ? [
              {
                documentTypeId: defaultIdentityType.id,
                documentKey: row.identificationNumber,
                status: 'Active' as const
              }
            ]
          : undefined,
      familyMembers:
        nok && defaultRelationship
          ? [
              {
                firstName: nok.firstName,
                lastName: nok.lastName,
                relationshipId: defaultRelationship.id,
                genderId: nokGenderId,
                mobileNumber: row.nextOfKinPhone
                  ? normalizeUgandaMobileInternational(row.nextOfKinPhone)
                  : undefined,
                dateFormat: FINERACT_DATE_FORMAT,
                locale: FINERACT_LOCALE
              }
            ]
          : undefined,
      address: hasAddress
        ? [
            {
              street: row.addressLine1 || undefined,
              addressLine1: row.residentialAddressLine1 || undefined,
              addressLine2: row.residentialAddressLine2 || undefined,
              city: row.city || undefined,
              stateProvinceId: state?.id,
              countryId: country?.id,
              postalCode: row.postalCode || undefined,
              isPrimary: true,
              isActive: true
            }
          ]
        : undefined
    };

    const parsed = saveDraftClientSchema.safeParse(inputCandidate);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid customer row.';
      return { ok: false, message: `Row ${row.rowNumber}: ${message}` };
    }

    prepared.push({
      rowNumber: row.rowNumber,
      displayName: `${row.firstName} ${row.lastName}`.trim(),
      officeName,
      externalId: row.externalId,
      input: parsed.data
    });
  }

  return { ok: true, rows: prepared };
}

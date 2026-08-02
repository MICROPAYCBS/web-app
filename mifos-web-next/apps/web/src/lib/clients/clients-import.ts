/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  createClientSchema,
  GENDER_FEMALE,
  GENDER_MALE,
  isValidUgandaMobileInternational,
  LEGAL_FORM_PERSON,
  normalizeUgandaMobileInternational,
  type CreateClientPayload
} from '@mifos/validation';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField,
  parseFineractDateString,
  toFineractDate
} from '@/lib/fineract/dates';

export const CLIENTS_IMPORT_PATH = '/clients/import';

export const CLIENTS_IMPORT_TEMPLATE_HINT =
  'Fill one person customer per row. Required: names, mobile (+256…), date of birth, office, staff, customer class, gender, nationality, marital status, submitted on, ID type/number, and next-of-kin (family) fields. Address columns are optional. Customers are created as drafts through the normal create API.';

export const CLIENTS_IMPORT_SHEET_NAME = 'Customers';

export const CLIENTS_IMPORT_COLUMNS = [
  'First Name',
  'Last Name',
  'Middle Name',
  'External ID',
  'Mobile',
  'Date of Birth',
  'Office Name',
  'Staff Name',
  'Customer Class',
  'Gender',
  'Nationality',
  'Marital Status',
  'Active',
  'Submitted On',
  'Activation Date',
  'ID Type',
  'ID Number',
  'Family First Name',
  'Family Last Name',
  'Family Relationship',
  'Family Gender',
  'Family Date of Birth',
  'Address Type',
  'Street',
  'City',
  'Country',
  'Postal Code',
  'Is Primary',
  'Is Active'
] as const;

export type ClientsImportColumn = (typeof CLIENTS_IMPORT_COLUMNS)[number];

export type ClientsImportLookupOption = {
  id: number;
  name: string;
  code?: string;
  officeId?: number;
  officeName?: string;
};

export type ClientsImportLookups = {
  offices: ClientsImportLookupOption[];
  staff: ClientsImportLookupOption[];
  customerClasses: ClientsImportLookupOption[];
  genders: ClientsImportLookupOption[];
  nationalities: ClientsImportLookupOption[];
  maritalStatuses: ClientsImportLookupOption[];
  identityTypes: ClientsImportLookupOption[];
  familyRelationships: ClientsImportLookupOption[];
  addressTypes: ClientsImportLookupOption[];
  countries: ClientsImportLookupOption[];
  clientTypes: ClientsImportLookupOption[];
  titles: ClientsImportLookupOption[];
  stateProvinces: ClientsImportLookupOption[];
};

export type ClientsImportWorkbookRawRow = {
  /** 1-based spreadsheet row number. */
  rowNumber: number;
  values: Partial<Record<ClientsImportColumn, unknown>>;
};

export type ClientsImportAnalyzedRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  middleName: string;
  externalId: string;
  mobile: string;
  dateOfBirth: string;
  officeName: string;
  staffName: string;
  customerClass: string;
  gender: string;
  nationality: string;
  maritalStatus: string;
  active: string;
  submittedOn: string;
  activationDate: string;
  idType: string;
  idNumber: string;
  familyFirstName: string;
  familyLastName: string;
  familyRelationship: string;
  familyGender: string;
  familyDateOfBirth: string;
  addressType: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  isPrimary: string;
  isActive: string;
  errors: string[];
  warnings: string[];
};

export type ClientsImportAnalysis = {
  rows: ClientsImportAnalyzedRow[];
  rowCount: number;
  errorRowCount: number;
  warningRowCount: number;
  canCreate: boolean;
};

export type ClientsImportPreparedRow = {
  rowNumber: number;
  displayName: string;
  officeName: string;
  externalId: string;
  input: CreateClientPayload;
};

export type ClientsImportRowProgressStatus =
  | 'pending'
  | 'creating'
  | 'success'
  | 'pending_approval'
  | 'failed';

export type ClientsImportRowProgress = {
  status: ClientsImportRowProgressStatus;
  message?: string;
  resourceId?: number;
};

export function cellText(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (value instanceof Date) {
    return toFineractDate(value);
  }
  return String(value).trim();
}

function normalizeKey(value: unknown): string {
  return cellText(value).replace(/\s+/g, ' ').toUpperCase();
}

function parseBooleanCell(
  value: string,
  label: string
): { ok: true; value: boolean } | { ok: false; message: string } | { ok: true; value: undefined } {
  if (!value) {
    return { ok: true, value: undefined };
  }
  const normalized = normalizeKey(value);
  if (['TRUE', 'YES', 'Y', '1'].includes(normalized)) {
    return { ok: true, value: true };
  }
  if (['FALSE', 'NO', 'N', '0'].includes(normalized)) {
    return { ok: true, value: false };
  }
  return { ok: false, message: `${label} must be TRUE or FALSE.` };
}

function parseDateCell(
  value: unknown,
  label: string,
  required: boolean
): { ok: true; value: string } | { ok: false; message: string } | { ok: true; value: undefined } {
  if (value instanceof Date) {
    return { ok: true, value: toFineractDate(value) };
  }
  const text = cellText(value);
  if (!text) {
    return required
      ? { ok: false, message: `${label} is required.` }
      : { ok: true, value: undefined };
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

function findLookup(
  options: ClientsImportLookupOption[],
  raw: string
): ClientsImportLookupOption | undefined {
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

function findGender(options: ClientsImportLookupOption[], raw: string): number | undefined {
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
  const match = findLookup(options, raw);
  return match?.id;
}

function staffMatchesOffice(
  staff: ClientsImportLookupOption,
  office: ClientsImportLookupOption
): boolean {
  if (staff.officeId != null) {
    return staff.officeId === office.id;
  }
  if (staff.officeName) {
    return normalizeKey(staff.officeName) === normalizeKey(office.name);
  }
  return true;
}

function hasAnyAddressValue(row: {
  addressType: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  isPrimary: string;
  isActive: string;
}): boolean {
  return Boolean(
    row.addressType ||
      row.street ||
      row.city ||
      row.country ||
      row.postalCode ||
      row.isPrimary ||
      row.isActive
  );
}

export function analyzeClientsImportRows(
  rawRows: ClientsImportWorkbookRawRow[],
  lookups: ClientsImportLookups
): ClientsImportAnalysis {
  const externalIdsInFile = new Map<string, number>();

  const rows: ClientsImportAnalyzedRow[] = rawRows.map(({ rowNumber, values }) => {
    const firstName = cellText(values['First Name']);
    const lastName = cellText(values['Last Name']);
    const middleName = cellText(values['Middle Name']);
    const externalId = cellText(values['External ID']);
    const mobile = cellText(values.Mobile);
    const dateOfBirth = cellText(values['Date of Birth']);
    const officeName = cellText(values['Office Name']);
    const staffName = cellText(values['Staff Name']);
    const customerClass = cellText(values['Customer Class']);
    const gender = cellText(values.Gender);
    const nationality = cellText(values.Nationality);
    const maritalStatus = cellText(values['Marital Status']);
    const active = cellText(values.Active);
    const submittedOn = cellText(values['Submitted On']);
    const activationDate = cellText(values['Activation Date']);
    const idType = cellText(values['ID Type']);
    const idNumber = cellText(values['ID Number']);
    const familyFirstName = cellText(values['Family First Name']);
    const familyLastName = cellText(values['Family Last Name']);
    const familyRelationship = cellText(values['Family Relationship']);
    const familyGender = cellText(values['Family Gender']);
    const familyDateOfBirth = cellText(values['Family Date of Birth']);
    const addressType = cellText(values['Address Type']);
    const street = cellText(values.Street);
    const city = cellText(values.City);
    const country = cellText(values.Country);
    const postalCode = cellText(values['Postal Code']);
    const isPrimary = cellText(values['Is Primary']);
    const isActive = cellText(values['Is Active']);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!firstName) {
      errors.push('First Name is required.');
    }
    if (!lastName) {
      errors.push('Last Name is required.');
    }

    if (!mobile) {
      errors.push('Mobile is required.');
    } else if (!isValidUgandaMobileInternational(mobile)) {
      errors.push('Mobile must be a Uganda number in international format (e.g. +2567…).');
    }

    const dob = parseDateCell(values['Date of Birth'], 'Date of Birth', true);
    if (!dob.ok) {
      errors.push(dob.message);
    }

    const office = findLookup(lookups.offices, officeName);
    if (!officeName) {
      errors.push('Office Name is required.');
    } else if (!office) {
      errors.push(`Unknown office "${officeName}".`);
    }

    const staff = findLookup(lookups.staff, staffName);
    if (!staffName) {
      errors.push('Staff Name is required.');
    } else if (!staff) {
      errors.push(`Unknown staff "${staffName}".`);
    } else if (office && !staffMatchesOffice(staff, office)) {
      errors.push(`Staff "${staffName}" does not belong to office "${officeName}".`);
    }

    const customerClassOption = findLookup(lookups.customerClasses, customerClass);
    if (!customerClass) {
      errors.push('Customer Class is required.');
    } else if (!customerClassOption) {
      errors.push(`Unknown customer class "${customerClass}".`);
    }

    const genderId = findGender(lookups.genders, gender);
    if (!gender) {
      errors.push('Gender is required.');
    } else if (genderId !== GENDER_MALE && genderId !== GENDER_FEMALE) {
      errors.push('Gender must be Male or Female.');
    }

    const nationalityOption = findLookup(lookups.nationalities, nationality);
    if (!nationality) {
      errors.push('Nationality is required.');
    } else if (!nationalityOption) {
      errors.push(`Unknown nationality "${nationality}".`);
    }

    const maritalOption = findLookup(lookups.maritalStatuses, maritalStatus);
    if (!maritalStatus) {
      errors.push('Marital Status is required.');
    } else if (!maritalOption) {
      errors.push(`Unknown marital status "${maritalStatus}".`);
    }

    const activeParsed = parseBooleanCell(active, 'Active');
    if (!activeParsed.ok) {
      errors.push(activeParsed.message);
    } else if (activeParsed.value === true) {
      warnings.push(
        'Active is ignored on import — customers are created as drafts for the normal workflow.'
      );
      const activation = parseDateCell(values['Activation Date'], 'Activation Date', true);
      if (!activation.ok) {
        errors.push(activation.message);
      }
    } else if (activationDate) {
      warnings.push('Activation Date is ignored unless Active is TRUE (and Active is not applied on import).');
    }

    const submitted = parseDateCell(values['Submitted On'], 'Submitted On', true);
    if (!submitted.ok) {
      errors.push(submitted.message);
    }

    const identityType = findLookup(lookups.identityTypes, idType);
    if (!idType) {
      errors.push('ID Type is required.');
    } else if (!identityType) {
      errors.push(`Unknown ID type "${idType}".`);
    }
    if (!idNumber) {
      errors.push('ID Number is required.');
    }

    if (!familyFirstName) {
      errors.push('Family First Name is required.');
    }
    if (!familyLastName) {
      errors.push('Family Last Name is required.');
    }
    const relationship = findLookup(lookups.familyRelationships, familyRelationship);
    if (!familyRelationship) {
      errors.push('Family Relationship is required.');
    } else if (!relationship) {
      errors.push(`Unknown family relationship "${familyRelationship}".`);
    }
    const familyGenderId = findGender(lookups.genders, familyGender);
    if (!familyGender) {
      errors.push('Family Gender is required.');
    } else if (familyGenderId !== GENDER_MALE && familyGenderId !== GENDER_FEMALE) {
      errors.push('Family Gender must be Male or Female.');
    }
    if (familyDateOfBirth) {
      const familyDob = parseDateCell(values['Family Date of Birth'], 'Family Date of Birth', false);
      if (!familyDob.ok) {
        errors.push(familyDob.message);
      }
    }

    const addressFilled = hasAnyAddressValue({
      addressType,
      street,
      city,
      country,
      postalCode,
      isPrimary,
      isActive
    });
    if (addressFilled) {
      if (addressType && !findLookup(lookups.addressTypes, addressType)) {
        errors.push(`Unknown address type "${addressType}".`);
      }
      if (country && !findLookup(lookups.countries, country)) {
        errors.push(`Unknown country "${country}".`);
      }
      const primaryParsed = parseBooleanCell(isPrimary, 'Is Primary');
      if (!primaryParsed.ok) {
        errors.push(primaryParsed.message);
      }
      const activeAddressParsed = parseBooleanCell(isActive, 'Is Active');
      if (!activeAddressParsed.ok) {
        errors.push(activeAddressParsed.message);
      }
      if (primaryParsed.ok && primaryParsed.value === true && activeAddressParsed.ok && activeAddressParsed.value === false) {
        errors.push('Primary address must be active.');
      }
    }

    if (externalId) {
      const duplicateRow = externalIdsInFile.get(normalizeKey(externalId));
      if (duplicateRow != null) {
        errors.push(`Duplicate External ID in file (also on row ${duplicateRow}).`);
      } else {
        externalIdsInFile.set(normalizeKey(externalId), rowNumber);
      }
    }

    return {
      rowNumber,
      firstName,
      lastName,
      middleName,
      externalId,
      mobile,
      dateOfBirth: dob.ok && dob.value ? dob.value : dateOfBirth,
      officeName,
      staffName,
      customerClass,
      gender,
      nationality,
      maritalStatus,
      active,
      submittedOn: submitted.ok && submitted.value ? submitted.value : submittedOn,
      activationDate,
      idType,
      idNumber,
      familyFirstName,
      familyLastName,
      familyRelationship,
      familyGender,
      familyDateOfBirth,
      addressType,
      street,
      city,
      country,
      postalCode,
      isPrimary,
      isActive,
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

export function prepareClientsImportRows(
  analysis: ClientsImportAnalysis,
  lookups: ClientsImportLookups
): { ok: true; rows: ClientsImportPreparedRow[] } | { ok: false; message: string } {
  if (!analysis.canCreate) {
    return { ok: false, message: 'Fix import errors before creating customers.' };
  }

  const prepared: ClientsImportPreparedRow[] = [];

  for (const row of analysis.rows) {
    const office = findLookup(lookups.offices, row.officeName);
    const staff = findLookup(lookups.staff, row.staffName);
    const customerClassOption = findLookup(lookups.customerClasses, row.customerClass);
    const genderId = findGender(lookups.genders, row.gender);
    const nationalityOption = findLookup(lookups.nationalities, row.nationality);
    const maritalOption = findLookup(lookups.maritalStatuses, row.maritalStatus);
    const identityType = findLookup(lookups.identityTypes, row.idType);
    const relationship = findLookup(lookups.familyRelationships, row.familyRelationship);
    const familyGenderId = findGender(lookups.genders, row.familyGender);

    if (
      !office ||
      !staff ||
      !customerClassOption ||
      (genderId !== GENDER_MALE && genderId !== GENDER_FEMALE) ||
      !nationalityOption ||
      !maritalOption ||
      !identityType ||
      !relationship ||
      (familyGenderId !== GENDER_MALE && familyGenderId !== GENDER_FEMALE)
    ) {
      return {
        ok: false,
        message: `Row ${row.rowNumber} could not be prepared. Re-analyze the file.`
      };
    }

    const submittedOn =
      normalizeFineractDateField(row.submittedOn) ?? toFineractDate();
    const dateOfBirth = normalizeFineractDateField(row.dateOfBirth);
    const familyDob = row.familyDateOfBirth
      ? normalizeFineractDateField(row.familyDateOfBirth)
      : undefined;

    const addressFilled = hasAnyAddressValue(row);
    const addressTypeOption = findLookup(lookups.addressTypes, row.addressType);
    const countryOption = findLookup(lookups.countries, row.country);
    const primaryParsed = parseBooleanCell(row.isPrimary, 'Is Primary');
    const activeAddressParsed = parseBooleanCell(row.isActive, 'Is Active');

    const input = {
      legalFormId: LEGAL_FORM_PERSON,
      officeId: office.id,
      staffId: staff.id,
      firstname: row.firstName,
      lastname: row.lastName,
      middlename: row.middleName || undefined,
      externalId: row.externalId || undefined,
      mobileNo: normalizeUgandaMobileInternational(row.mobile),
      dateOfBirth,
      customerClassId: customerClassOption.id,
      genderId: genderId as typeof GENDER_MALE | typeof GENDER_FEMALE,
      nationalityCountryId: nationalityOption.id,
      maritalStatusId: maritalOption.id,
      submittedOnDate: submittedOn,
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE,
      clientIdentifiers: [
        {
          documentTypeId: identityType.id,
          documentKey: row.idNumber,
          status: 'Active'
        }
      ],
      familyMembers: [
        {
          firstName: row.familyFirstName,
          lastName: row.familyLastName,
          relationshipId: relationship.id,
          genderId: familyGenderId,
          dateOfBirth: familyDob,
          dateFormat: FINERACT_DATE_FORMAT,
          locale: FINERACT_LOCALE
        }
      ],
      address: addressFilled
        ? [
            {
              addressTypeId: addressTypeOption?.id,
              street: row.street || undefined,
              city: row.city || undefined,
              countryId: countryOption?.id,
              postalCode: row.postalCode || undefined,
              isPrimary: primaryParsed.ok ? (primaryParsed.value ?? true) : true,
              isActive: activeAddressParsed.ok ? (activeAddressParsed.value ?? true) : true
            }
          ]
        : undefined
    };

    const parsed = createClientSchema.safeParse(input);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid customer row.';
      return { ok: false, message: `Row ${row.rowNumber}: ${message}` };
    }

    prepared.push({
      rowNumber: row.rowNumber,
      displayName: `${row.firstName} ${row.lastName}`.trim(),
      officeName: office.name,
      externalId: row.externalId,
      input: parsed.data
    });
  }

  return { ok: true, rows: prepared };
}

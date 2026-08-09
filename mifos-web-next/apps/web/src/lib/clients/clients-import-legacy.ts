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
  LEGAL_FORM_ENTITY,
  LEGAL_FORM_PERSON,
  legacyImportClientSchema,
  normalizeUgandaMobileInternational,
  type LegacyImportClientPayload
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

/** Fineract organization bulk-import definition name for customers. */
export const CLIENTS_LEGACY_BULK_IMPORT_NAME = 'Clients';

export const CLIENTS_LEGACY_IMPORT_SHEET_PERSON = 'ClientPerson';
export const CLIENTS_LEGACY_IMPORT_SHEET_ENTITY = 'ClientEntity';

/** @deprecated Prefer CLIENTS_LEGACY_IMPORT_SHEET_PERSON. */
export const CLIENTS_LEGACY_IMPORT_SHEET_NAME = CLIENTS_LEGACY_IMPORT_SHEET_PERSON;

export type ClientsLegacyImportLegalForm = 'Person' | 'Entity';

export const CLIENTS_LEGACY_IMPORT_TEMPLATE_HINT =
  'Downloads the stock platform Customers Excel template (original columns only). Branch, profile type, and deposit product selected here are applied on create — they backfill the payload even when the file does not carry them. Customers are created active one by one with live progress. Micropay-only fields are not required.';

/**
 * Canonical column keys for Fineract ClientPerson / ClientEntity workbook headers
 * (trailing spaces / asterisks are normalized when parsing).
 */
export const CLIENTS_LEGACY_IMPORT_COLUMNS = [
  'First Name',
  'Last Name',
  'Middle Name',
  'Name',
  'Office Name',
  'Staff Name',
  'External ID',
  'Active',
  'Submitted On Date',
  'Activation Date',
  'Mobile Number',
  'Date of Birth',
  'Client Type',
  'Gender',
  'Client Classification',
  'Is Staff Member',
  'Constitution',
  'Incorporation Number',
  'Incorporation Validity Till Date',
  'Main Business Line',
  'Remarks',
  'Address Enabled',
  'Address Type',
  'Street',
  'Address Line 1',
  'Address Line 2',
  'Address Line 3',
  'City',
  'State / Province',
  'Country',
  'Postal Code',
  'Is Active Address'
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
  name: string;
  officeName: string;
  staffName: string;
  externalId: string;
  active: string;
  submittedOn: string;
  activationDate: string;
  mobile: string;
  dateOfBirth: string;
  clientType: string;
  gender: string;
  constitution: string;
  incorporationNumber: string;
  incorporationValidityTill: string;
  mainBusinessLine: string;
  remarks: string;
  addressEnabled: string;
  addressType: string;
  street: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  stateProvince: string;
  country: string;
  postalCode: string;
  isActiveAddress: string;
  errors: string[];
  warnings: string[];
};

export type ClientsLegacyImportPreparedRow = {
  rowNumber: number;
  displayName: string;
  officeName: string;
  externalId: string;
  input: LegacyImportClientPayload;
};

export type ClientsLegacyImportAnalysis = {
  rows: ClientsLegacyImportAnalyzedRow[];
  rowCount: number;
  errorRowCount: number;
  warningRowCount: number;
  canCreate: boolean;
};

export type ClientsLegacyImportRowProgress = ClientsImportRowProgress;

export type ClientsLegacyImportOptions = {
  /** Required for prepare — always becomes create `officeId` (UI backfill). */
  selectedOfficeId?: number;
  /** Required — always becomes create `legalFormId` (UI backfill). */
  legalForm?: ClientsLegacyImportLegalForm;
  /** Optional — when set, applied to every create row as `savingsProductId`. */
  savingsProductId?: number;
  /** Optional — when set, used when the sheet has no Staff Name. */
  selectedStaffId?: number;
};

function normalizeKey(value: unknown): string {
  return cellText(value).replace(/\s+/g, ' ').toUpperCase();
}

/** Match lookup by id, exact name/code, or Fineract "Name-Id" cell values. */
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
  const dashed = raw.trim().match(/^(.*)-(\d+)$/);
  if (dashed) {
    const id = Number(dashed[2]);
    const namePart = normalizeKey(dashed[1]);
    const byIdAndName = options.find(
      (option) => option.id === id && normalizeKey(option.name) === namePart
    );
    if (byIdAndName) {
      return byIdAndName;
    }
    const byIdOnly = options.find((option) => option.id === id);
    if (byIdOnly) {
      return byIdOnly;
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

function parseBooleanCell(
  value: string,
  label: string,
  required: boolean
): { ok: true; value?: boolean } | { ok: false; message: string } {
  if (!value) {
    return required
      ? { ok: false, message: `${label} is required.` }
      : { ok: true, value: undefined };
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
): { ok: true; value?: string } | { ok: false; message: string } {
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

function sharedAddressAndContactChecks(
  values: ClientsLegacyImportWorkbookRawRow['values'],
  lookups: ClientsImportLookups,
  errors: string[],
  warnings: string[]
) {
  const mobile = cellText(values['Mobile Number']);
  const clientType = cellText(values['Client Type']);
  const addressEnabled = cellText(values['Address Enabled']);
  const addressType = cellText(values['Address Type']);
  const street = cellText(values.Street);
  const addressLine1 = cellText(values['Address Line 1']);
  const addressLine2 = cellText(values['Address Line 2']);
  const addressLine3 = cellText(values['Address Line 3']);
  const city = cellText(values.City);
  const stateProvince = cellText(values['State / Province']);
  const country = cellText(values.Country);
  const postalCode = cellText(values['Postal Code']);
  const isActiveAddress = cellText(values['Is Active Address']);

  if (mobile && !isValidUgandaMobileInternational(mobile)) {
    errors.push('Mobile number must be a Uganda number in international format (e.g. +2567…).');
  }

  if (clientType && lookups.clientTypes.length > 0 && !findLookup(lookups.clientTypes, clientType)) {
    errors.push(`Unknown client type "${clientType}".`);
  }

  if (cellText(values['Client Classification'])) {
    warnings.push('Client Classification is not imported in guided legacy mode.');
  }

  const addressEnabledParsed = parseBooleanCell(addressEnabled, 'Address Enabled', false);
  if (!addressEnabledParsed.ok) {
    errors.push(addressEnabledParsed.message);
  }
  const addressOn =
    addressEnabledParsed.ok && addressEnabledParsed.value === true
      ? true
      : Boolean(addressType || street || addressLine1 || city || country || postalCode);

  if (addressOn) {
    if (addressType && lookups.addressTypes.length > 0 && !findLookup(lookups.addressTypes, addressType)) {
      warnings.push(`Address Type "${addressType}" was not matched and will be skipped.`);
    }
    if (country && !findLookup(lookups.countries, country)) {
      warnings.push(`Country "${country}" was not matched and will be skipped.`);
    }
    if (
      stateProvince &&
      lookups.stateProvinces.length > 0 &&
      !findLookup(lookups.stateProvinces, stateProvince)
    ) {
      warnings.push(`State/Province "${stateProvince}" was not matched and will be skipped.`);
    }
    const activeAddressParsed = parseBooleanCell(isActiveAddress, 'Is active Address', false);
    if (!activeAddressParsed.ok) {
      errors.push(activeAddressParsed.message);
    }
  }

  return {
    mobile,
    clientType,
    addressEnabled,
    addressType,
    street,
    addressLine1,
    addressLine2,
    addressLine3,
    city,
    stateProvince,
    country,
    postalCode,
    isActiveAddress
  };
}

/**
 * Prefer the UI-selected branch. The stock template may omit or mis-match Office Name;
 * create always uses the selected branch.
 */
function resolveOffice(
  officeName: string,
  lookups: ClientsImportLookups,
  selectedOffice: ClientsImportLookups['offices'][number] | undefined,
  errors: string[],
  warnings: string[]
) {
  if (selectedOffice) {
    if (officeName) {
      const fromSheet = findLookup(lookups.offices, officeName);
      if (!fromSheet || fromSheet.id !== selectedOffice.id) {
        warnings.push(
          `Using selected branch "${selectedOffice.name}" (file office ignored).`
        );
      }
    } else {
      warnings.push(`Using selected branch "${selectedOffice.name}".`);
    }
    return selectedOffice;
  }

  const fromSheet = officeName ? findLookup(lookups.offices, officeName) : undefined;
  if (!officeName) {
    errors.push('Office Name is required (or select a branch).');
  } else if (!fromSheet) {
    errors.push(`Unknown office "${officeName}".`);
  }
  return fromSheet;
}

function validateActiveAndDates(
  values: ClientsLegacyImportWorkbookRawRow['values'],
  active: string,
  errors: string[]
): { submittedOn: string; activationDate: string } {
  const activeParsed = parseBooleanCell(active, 'Active', true);
  if (!activeParsed.ok) {
    errors.push(activeParsed.message);
  } else if (activeParsed.value !== true) {
    errors.push('Active must be TRUE — legacy import creates activated customers.');
  }

  const submitted = parseDateCell(values['Submitted On Date'], 'Submitted On Date', true);
  if (!submitted.ok) {
    errors.push(submitted.message);
  }

  const activation = parseDateCell(values['Activation Date'], 'Activation Date', true);
  if (!activation.ok) {
    errors.push(activation.message);
  }

  return {
    submittedOn: submitted.ok && submitted.value ? submitted.value : cellText(values['Submitted On Date']),
    activationDate:
      activation.ok && activation.value ? activation.value : cellText(values['Activation Date'])
  };
}

export function analyzeClientsLegacyImportRows(
  rawRows: ClientsLegacyImportWorkbookRawRow[],
  lookups: ClientsImportLookups,
  options?: ClientsLegacyImportOptions
): ClientsLegacyImportAnalysis {
  const legalForm = options?.legalForm ?? 'Person';
  const selectedOffice = options?.selectedOfficeId
    ? lookups.offices.find((office) => office.id === options.selectedOfficeId)
    : undefined;
  const externalIdsInFile = new Map<string, number>();

  const rows: ClientsLegacyImportAnalyzedRow[] = rawRows.map(({ rowNumber, values }) => {
    const firstName = cellText(values['First Name']);
    const lastName = cellText(values['Last Name']);
    const middleName = cellText(values['Middle Name']);
    const name = cellText(values.Name);
    const officeName = cellText(values['Office Name']);
    const staffName = cellText(values['Staff Name']);
    const externalId = cellText(values['External ID']);
    const active = cellText(values.Active);
    const gender = cellText(values.Gender);
    const constitution = cellText(values.Constitution);
    const incorporationNumber = cellText(values['Incorporation Number']);
    const mainBusinessLine = cellText(values['Main Business Line']);
    const remarks = cellText(values.Remarks);
    const errors: string[] = [];
    const warnings: string[] = [];

    const resolvedOffice = resolveOffice(officeName, lookups, selectedOffice, errors, warnings);

    if (staffName && !findLookup(lookups.staff, staffName)) {
      errors.push(`Unknown staff "${staffName}".`);
    }

    const dates = validateActiveAndDates(values, active, errors);
    const contact = sharedAddressAndContactChecks(values, lookups, errors, warnings);

    const dob = parseDateCell(values['Date of Birth'], 'Date of Birth', false);
    if (!dob.ok) {
      errors.push(dob.message);
    }

    const incorpTill = parseDateCell(
      values['Incorporation Validity Till Date'],
      'Incorporation Validity Till Date',
      false
    );
    if (!incorpTill.ok) {
      errors.push(incorpTill.message);
    }

    if (legalForm === 'Entity') {
      if (!name) {
        errors.push('Name is required.');
      }
      if (!constitution) {
        errors.push('Constitution is required.');
      } else if (
        lookups.constitutions.length > 0 &&
        !findLookup(lookups.constitutions, constitution)
      ) {
        errors.push(`Unknown constitution "${constitution}".`);
      }
      if (
        mainBusinessLine &&
        lookups.mainBusinessLines.length > 0 &&
        !findLookup(lookups.mainBusinessLines, mainBusinessLine)
      ) {
        errors.push(`Unknown main business line "${mainBusinessLine}".`);
      }
    } else {
      if (!firstName) {
        errors.push('First Name is required.');
      }
      if (!lastName) {
        errors.push('Last Name is required.');
      }
      if (gender) {
        const genderId = findGender(lookups.genders, gender);
        if (genderId !== GENDER_MALE && genderId !== GENDER_FEMALE) {
          errors.push(`Unknown gender "${gender}".`);
        }
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
      firstName: legalForm === 'Entity' ? name : firstName,
      lastName: legalForm === 'Entity' ? '' : lastName,
      middleName,
      name,
      officeName: resolvedOffice?.name ?? officeName,
      staffName,
      externalId,
      active,
      submittedOn: dates.submittedOn,
      activationDate: dates.activationDate,
      mobile: contact.mobile,
      dateOfBirth: dob.ok && dob.value ? dob.value : cellText(values['Date of Birth']),
      clientType: contact.clientType,
      gender,
      constitution,
      incorporationNumber,
      incorporationValidityTill:
        incorpTill.ok && incorpTill.value
          ? incorpTill.value
          : cellText(values['Incorporation Validity Till Date']),
      mainBusinessLine,
      remarks,
      addressEnabled: contact.addressEnabled,
      addressType: contact.addressType,
      street: contact.street,
      addressLine1: contact.addressLine1,
      addressLine2: contact.addressLine2,
      addressLine3: contact.addressLine3,
      city: contact.city,
      stateProvince: contact.stateProvince,
      country: contact.country,
      postalCode: contact.postalCode,
      isActiveAddress: contact.isActiveAddress,
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

function buildAddressPayload(
  row: ClientsLegacyImportAnalyzedRow,
  lookups: ClientsImportLookups
) {
  const country = row.country ? findLookup(lookups.countries, row.country) : undefined;
  const state = row.stateProvince
    ? findLookup(lookups.stateProvinces, row.stateProvince)
    : undefined;
  const addressType = row.addressType
    ? findLookup(lookups.addressTypes, row.addressType)
    : undefined;

  const addressOn = Boolean(
    row.street ||
      row.addressLine1 ||
      row.addressLine2 ||
      row.addressLine3 ||
      row.city ||
      row.postalCode ||
      country ||
      state ||
      addressType
  );

  if (!addressOn) {
    return undefined;
  }

  const activeAddress = parseBooleanCell(row.isActiveAddress, 'Is active Address', false);
  return [
    {
      addressTypeId: addressType?.id,
      street: row.street || undefined,
      addressLine1: row.addressLine1 || undefined,
      addressLine2: row.addressLine2 || undefined,
      addressLine3: row.addressLine3 || undefined,
      city: row.city || undefined,
      stateProvinceId: state?.id,
      countryId: country?.id,
      postalCode: row.postalCode || undefined,
      isPrimary: true,
      isActive: activeAddress.ok ? (activeAddress.value ?? true) : true
    }
  ];
}

export function prepareClientsLegacyImportRows(
  analysis: ClientsLegacyImportAnalysis,
  lookups: ClientsImportLookups,
  options?: ClientsLegacyImportOptions
): { ok: true; rows: ClientsLegacyImportPreparedRow[] } | { ok: false; message: string } {
  if (!analysis.canCreate) {
    return { ok: false, message: 'Fix import errors before creating customers.' };
  }

  const legalForm = options?.legalForm ?? 'Person';
  const selectedOffice = options?.selectedOfficeId
    ? lookups.offices.find((office) => office.id === options.selectedOfficeId)
    : undefined;
  if (!selectedOffice) {
    return {
      ok: false,
      message: 'Select a branch before creating customers. Branch is applied to every row on create.'
    };
  }
  if (!options?.legalForm) {
    return {
      ok: false,
      message: 'Select a profile type before creating customers.'
    };
  }

  const selectedStaff = options?.selectedStaffId
    ? lookups.staff.find((staff) => staff.id === options.selectedStaffId)
    : undefined;
  const prepared: ClientsLegacyImportPreparedRow[] = [];

  for (const row of analysis.rows) {
    const staffFromSheet = row.staffName ? findLookup(lookups.staff, row.staffName) : undefined;
    const staff = staffFromSheet ?? selectedStaff;
    const clientType = row.clientType
      ? findLookup(lookups.clientTypes, row.clientType)
      : undefined;
    const submittedOn = normalizeFineractDateField(row.submittedOn);
    const activationDate = normalizeFineractDateField(row.activationDate);
    if (!submittedOn || !activationDate) {
      return {
        ok: false,
        message: `Row ${row.rowNumber}: Submitted On Date and Activation Date are required.`
      };
    }

    const base = {
      officeId: selectedOffice.id,
      staffId: staff?.id,
      externalId: row.externalId || undefined,
      mobileNo: row.mobile ? normalizeUgandaMobileInternational(row.mobile) : undefined,
      clientTypeId: clientType?.id,
      submittedOnDate: submittedOn,
      active: true as const,
      activationDate,
      savingsProductId: options?.savingsProductId,
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE,
      address: buildAddressPayload(row, lookups)
    };

    const inputCandidate =
      legalForm === 'Entity'
        ? {
            ...base,
            legalFormId: LEGAL_FORM_ENTITY as typeof LEGAL_FORM_ENTITY,
            fullname: row.name || row.firstName,
            clientNonPersonDetails: {
              constitutionId: findLookup(lookups.constitutions, row.constitution)?.id,
              incorpNumber: row.incorporationNumber || undefined,
              incorpValidityTillDate: row.incorporationValidityTill
                ? normalizeFineractDateField(row.incorporationValidityTill)
                : undefined,
              mainBusinessLineId: row.mainBusinessLine
                ? findLookup(lookups.mainBusinessLines, row.mainBusinessLine)?.id
                : undefined,
              remarks: row.remarks || undefined,
              dateFormat: FINERACT_DATE_FORMAT,
              locale: FINERACT_LOCALE
            }
          }
        : {
            ...base,
            legalFormId: LEGAL_FORM_PERSON as typeof LEGAL_FORM_PERSON,
            firstname: row.firstName,
            lastname: row.lastName,
            middlename: row.middleName || undefined,
            dateOfBirth: row.dateOfBirth
              ? normalizeFineractDateField(row.dateOfBirth)
              : undefined,
            genderId: (() => {
              const genderId = row.gender ? findGender(lookups.genders, row.gender) : undefined;
              return genderId === GENDER_MALE || genderId === GENDER_FEMALE
                ? genderId
                : undefined;
            })()
          };

    const parsed = legacyImportClientSchema.safeParse(inputCandidate);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid customer row.';
      return { ok: false, message: `Row ${row.rowNumber}: ${message}` };
    }

    prepared.push({
      rowNumber: row.rowNumber,
      displayName:
        legalForm === 'Entity'
          ? (row.name || row.firstName).trim()
          : `${row.firstName} ${row.lastName}`.trim(),
      officeName: selectedOffice.name,
      externalId: row.externalId,
      input: parsed.data
    });
  }

  return { ok: true, rows: prepared };
}

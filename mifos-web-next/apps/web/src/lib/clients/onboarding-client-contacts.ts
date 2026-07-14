/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientContactInput } from '@mifos/validation';

export type OnboardingContactFields = {
  mobileNo?: string | null;
  alternativeMobileNo?: string | null;
  emailAddress?: string | null;
  alternativeEmailAddress?: string | null;
};

export type OnboardingContactTypeOption = {
  id: number;
  typeCode: string;
  typeName: string;
};

export type MappedOnboardingClientContact = ClientContactInput & {
  typeCode: string;
  typeName: string;
  sourceField: keyof OnboardingContactFields;
};

const MOBILE_TYPE_CODES = ['MOBILE', 'PHONE', 'CELL'];
const EMAIL_TYPE_CODES = ['EMAIL'];

function normalizeToken(value: string): string {
  return value.trim().toUpperCase().replace(/[\s_-]+/g, '');
}

function findContactType(
  options: OnboardingContactTypeOption[],
  kind: 'mobile' | 'email'
): OnboardingContactTypeOption | undefined {
  const codes = kind === 'mobile' ? MOBILE_TYPE_CODES : EMAIL_TYPE_CODES;
  const byCode = options.find((option) =>
    codes.some((code) => normalizeToken(option.typeCode) === normalizeToken(code))
  );
  if (byCode) {
    return byCode;
  }

  return options.find((option) => {
    const normalized = normalizeToken(option.typeName);
    if (kind === 'mobile') {
      return (
        normalized.includes('MOBILE') ||
        normalized.includes('PHONE') ||
        normalized.includes('CELL')
      );
    }
    return normalized.includes('EMAIL');
  });
}

function trimContactValue(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Maps create-client onboarding contact scalars onto typed client contacts.
 * Phone fields use Mobile; email fields use Email. Primary values are marked
 * primary; alternatives are stored as non-primary rows of the same type.
 */
export function mapOnboardingFieldsToClientContacts(
  fields: OnboardingContactFields,
  options: OnboardingContactTypeOption[]
): MappedOnboardingClientContact[] {
  const mobileType = findContactType(options, 'mobile');
  const emailType = findContactType(options, 'email');
  const mapped: MappedOnboardingClientContact[] = [];

  const mobileNo = trimContactValue(fields.mobileNo);
  const alternativeMobileNo = trimContactValue(fields.alternativeMobileNo);
  const emailAddress = trimContactValue(fields.emailAddress);
  const alternativeEmailAddress = trimContactValue(fields.alternativeEmailAddress);

  if (mobileType && mobileNo) {
    mapped.push({
      contactTypeId: mobileType.id,
      contactValue: mobileNo,
      primary: true,
      typeCode: mobileType.typeCode,
      typeName: mobileType.typeName,
      sourceField: 'mobileNo'
    });
  }

  if (mobileType && alternativeMobileNo && alternativeMobileNo !== mobileNo) {
    mapped.push({
      contactTypeId: mobileType.id,
      contactValue: alternativeMobileNo,
      primary: false,
      typeCode: mobileType.typeCode,
      typeName: mobileType.typeName,
      sourceField: 'alternativeMobileNo'
    });
  }

  if (emailType && emailAddress) {
    mapped.push({
      contactTypeId: emailType.id,
      contactValue: emailAddress,
      primary: true,
      typeCode: emailType.typeCode,
      typeName: emailType.typeName,
      sourceField: 'emailAddress'
    });
  }

  if (emailType && alternativeEmailAddress && alternativeEmailAddress !== emailAddress) {
    mapped.push({
      contactTypeId: emailType.id,
      contactValue: alternativeEmailAddress,
      primary: false,
      typeCode: emailType.typeCode,
      typeName: emailType.typeName,
      sourceField: 'alternativeEmailAddress'
    });
  }

  return mapped;
}

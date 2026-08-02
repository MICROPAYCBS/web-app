/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OfficeBranchProfile } from '@mifos/api-client';
import type { BranchProfileInput } from '@mifos/validation';

export const BRANCH_TYPE_OPTIONS = [
  'Main Branch',
  'Service Centre',
  'Agency Branch',
  'Mobile',
  'Digital Branch'
] as const;

export const BRANCH_REGION_OPTIONS = ['Central', 'Eastern', 'Western', 'Northern'] as const;

export const BRANCH_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'] as const;

export type BranchProfileFormFields = {
  officeCode: string;
  branchType: string;
  regionCode: string;
  address: string;
  city: string;
  countryCode: string;
  phoneNo: string;
  emailAddress: string;
  managerStaffId: string;
  swiftCode: string;
  latitude: string;
  longitude: string;
  cashLimit: string;
  workingHours: string;
  status: string;
};

export function defaultBranchProfileFormFields(): BranchProfileFormFields {
  return {
    officeCode: '',
    branchType: '',
    regionCode: '',
    address: '',
    city: '',
    countryCode: '',
    phoneNo: '',
    emailAddress: '',
    managerStaffId: '',
    swiftCode: '',
    latitude: '',
    longitude: '',
    cashLimit: '',
    workingHours: '',
    status: ''
  };
}

export function branchProfileFormFromApi(
  profile?: OfficeBranchProfile | null
): BranchProfileFormFields {
  if (!profile) {
    return defaultBranchProfileFormFields();
  }
  return {
    officeCode: profile.officeCode ?? '',
    branchType: profile.branchType ?? '',
    regionCode: profile.regionCode ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    countryCode: profile.countryCode ?? '',
    phoneNo: profile.phoneNo ?? '',
    emailAddress: profile.emailAddress ?? '',
    managerStaffId: profile.managerStaffId != null ? String(profile.managerStaffId) : '',
    swiftCode: profile.swiftCode ?? '',
    latitude: profile.latitude ?? '',
    longitude: profile.longitude ?? '',
    cashLimit: profile.cashLimit != null ? String(profile.cashLimit) : '',
    workingHours: profile.workingHours ?? '',
    status: profile.status ?? ''
  };
}

export function branchProfileInputFromForm(
  form: BranchProfileFormFields,
  options?: { lockedBranchCode?: string }
): BranchProfileInput | undefined {
  const lockedCode = options?.lockedBranchCode?.trim();
  const candidates: BranchProfileInput = {
    officeCode: lockedCode || form.officeCode.trim() || undefined,
    branchType: form.branchType.trim() || undefined,
    regionCode: form.regionCode.trim() || undefined,
    address: form.address.trim() || undefined,
    city: form.city.trim() || undefined,
    countryCode: form.countryCode.trim() || undefined,
    phoneNo: form.phoneNo.trim() || undefined,
    emailAddress: form.emailAddress.trim() || undefined,
    managerStaffId: form.managerStaffId ? Number(form.managerStaffId) : undefined,
    swiftCode: form.swiftCode.trim() || undefined,
    latitude: form.latitude.trim() || undefined,
    longitude: form.longitude.trim() || undefined,
    cashLimit: form.cashLimit.trim() ? Number(form.cashLimit) : undefined,
    workingHours: form.workingHours.trim() || undefined,
    status:
      form.status === 'ACTIVE' || form.status === 'INACTIVE' ? form.status : undefined
  };

  const payload: BranchProfileInput = {};
  for (const [key, value] of Object.entries(candidates)) {
    if (value !== undefined && value !== '') {
      (payload as Record<string, unknown>)[key] = value;
    }
  }

  return Object.keys(payload).length > 0 ? payload : undefined;
}

export function branchCodeLabel(office: { name?: string; branchProfile?: OfficeBranchProfile | null }) {
  return office.branchProfile?.officeCode?.trim() || null;
}

/** True when a branch code was previously saved — it must not be changed afterward. */
export function isBranchCodeLocked(officeCode?: string | null): boolean {
  return Boolean(officeCode?.trim());
}

export const BRANCH_CODE_LOCKED_HINT =
  'This code is used when generating account numbers and cannot be changed after it has been set.';

export const BRANCH_CODE_EDITABLE_HINT =
  'Used in structured account number patterns. Choose carefully — it cannot be changed once saved.';

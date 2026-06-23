import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CustomerClass,
  CustomerClassMutationResponse,
  CustomerClassRestrictionOption,
  CustomerClassTemplate
} from '@mifos/api-client';
import { buildUpsertCustomerClassPayload, type UpsertCustomerClassPayload } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/customerclasses';

function fromYn(value: unknown): boolean | undefined {
  if (value === true || value === 'Y' || value === 'y') {
    return true;
  }
  if (value === false || value === 'N' || value === 'n') {
    return false;
  }
  return undefined;
}

function normalizeRestrictionOption(raw: unknown): CustomerClassRestrictionOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const restrictionCode = typeof row.restrictionCode === 'string' ? row.restrictionCode : '';
  const restrictionName = typeof row.restrictionName === 'string' ? row.restrictionName : '';
  if (!Number.isFinite(id) || !restrictionCode || !restrictionName) {
    return null;
  }
  return { id, restrictionCode, restrictionName };
}

function normalizeCustomerClass(raw: unknown): CustomerClass | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const classCode = typeof row.classCode === 'string' ? row.classCode : '';
  const className = typeof row.className === 'string' ? row.className : '';
  if (!Number.isFinite(id) || !classCode || !className) {
    return null;
  }
  return {
    id,
    classCode,
    className,
    description: typeof row.description === 'string' ? row.description : undefined,
    customerType: typeof row.customerType === 'string' ? row.customerType : undefined,
    riskLevel: typeof row.riskLevel === 'string' ? row.riskLevel : undefined,
    kycLevel: typeof row.kycLevel === 'string' ? row.kycLevel : undefined,
    loanEligible: fromYn(row.loanEligible),
    restrictionId: row.restrictionId != null ? Number(row.restrictionId) : undefined,
    restrictionCode: typeof row.restrictionCode === 'string' ? row.restrictionCode : undefined,
    restrictionName: typeof row.restrictionName === 'string' ? row.restrictionName : undefined,
    overdraftAllowed: fromYn(row.overdraftAllowed),
    enhancedDueDiligence: fromYn(row.enhancedDueDiligence),
    reclassificationAllowed: fromYn(row.reclassificationAllowed),
    minAge: row.minAge != null ? Number(row.minAge) : undefined,
    maxAge: row.maxAge != null ? Number(row.maxAge) : undefined,
    enforceCustPhoto: fromYn(row.enforceCustPhoto),
    enforceCustSignature: fromYn(row.enforceCustSignature),
    enforceCustDocument: fromYn(row.enforceCustDocument),
    autoCreateAccount: fromYn(row.autoCreateAccount),
    status: typeof row.status === 'string' ? row.status : undefined
  };
}

function normalizeTemplate(raw: unknown): CustomerClassTemplate {
  if (!raw || typeof raw !== 'object') {
    return {
      customerTypeOptions: [],
      riskLevelOptions: [],
      kycLevelOptions: [],
      statusOptions: [],
      restrictionOptions: []
    };
  }
  const row = raw as Record<string, unknown>;
  const asStrings = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  return {
    customerTypeOptions: asStrings(row.customerTypeOptions),
    riskLevelOptions: asStrings(row.riskLevelOptions),
    kycLevelOptions: asStrings(row.kycLevelOptions),
    statusOptions: asStrings(row.statusOptions),
    restrictionOptions: Array.isArray(row.restrictionOptions)
      ? row.restrictionOptions
          .map((item) => normalizeRestrictionOption(item))
          .filter((item): item is CustomerClassRestrictionOption => item !== null)
      : []
  };
}

export async function listCustomerClasses(): Promise<CustomerClass[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeCustomerClass(item))
    .filter((item): item is CustomerClass => item !== null)
    .sort((left, right) => left.className.localeCompare(right.className));
}

export async function getCustomerClassTemplate(): Promise<CustomerClassTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);
  return normalizeTemplate(raw);
}

export async function getCustomerClass(customerClassId: number): Promise<CustomerClass | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${customerClassId}`);
  return normalizeCustomerClass(raw);
}

export async function createCustomerClass(
  input: UpsertCustomerClassPayload
): Promise<CustomerClassMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<CustomerClassMutationResponse>(
    BASE_PATH,
    buildUpsertCustomerClassPayload(input)
  );
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateCustomerClass(
  customerClassId: number,
  input: UpsertCustomerClassPayload
): Promise<CustomerClassMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<CustomerClassMutationResponse>(
    `${BASE_PATH}/${customerClassId}`,
    buildUpsertCustomerClassPayload(input)
  );
  return { resourceId: Number(raw?.resourceId ?? customerClassId) };
}

export async function deleteCustomerClass(customerClassId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${BASE_PATH}/${customerClassId}`);
}

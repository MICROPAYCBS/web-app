import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractFinancialActivityGlAccountOptions,
  FineractFinancialActivityGlAccountRef,
  FineractFinancialActivityMappingDetail,
  FineractFinancialActivityMappingEditData,
  FineractFinancialActivityMappingFormTemplate,
  FineractFinancialActivityMappingListItem,
  FineractFinancialActivityMappingMutationResponse,
  FineractFinancialActivityRef
} from '@mifos/api-client';
import { buildUpsertFinancialActivityMappingPayload, type UpsertFinancialActivityMappingFormInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const FINANCIAL_ACTIVITY_ACCOUNTS_PATH = '/financialactivityaccounts';

function normalizeFinancialActivityRef(raw: unknown): FineractFinancialActivityRef | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    name,
    mappedGLAccountType:
      typeof row.mappedGLAccountType === 'string' ? row.mappedGLAccountType : undefined
  };
}

function normalizeGlAccountRef(raw: unknown): FineractFinancialActivityGlAccountRef | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const glCode = typeof row.glCode === 'string' ? row.glCode : '';
  if (!Number.isFinite(id) || !name || !glCode) {
    return null;
  }
  return { id, name, glCode };
}

function normalizeGlAccountOptions(raw: unknown): FineractFinancialActivityGlAccountOptions {
  if (!raw || typeof raw !== 'object') {
    return {
      assetAccountOptions: [],
      liabilityAccountOptions: [],
      equityAccountOptions: []
    };
  }
  const row = raw as Record<string, unknown>;
  const mapAccounts = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => normalizeGlAccountRef(item))
          .filter((item): item is FineractFinancialActivityGlAccountRef => item !== null)
      : [];

  return {
    assetAccountOptions: mapAccounts(row.assetAccountOptions),
    liabilityAccountOptions: mapAccounts(row.liabilityAccountOptions),
    equityAccountOptions: mapAccounts(row.equityAccountOptions)
  };
}

function normalizeFormTemplate(raw: unknown): FineractFinancialActivityMappingFormTemplate {
  if (!raw || typeof raw !== 'object') {
    return {
      financialActivityOptions: [],
      glAccountOptions: {
        assetAccountOptions: [],
        liabilityAccountOptions: [],
        equityAccountOptions: []
      }
    };
  }
  const row = raw as Record<string, unknown>;
  return {
    financialActivityOptions: Array.isArray(row.financialActivityOptions)
      ? row.financialActivityOptions
          .map((item) => normalizeFinancialActivityRef(item))
          .filter((item): item is FineractFinancialActivityRef => item !== null)
      : [],
    glAccountOptions: normalizeGlAccountOptions(row.glAccountOptions)
  };
}

function normalizeMappingListItem(raw: unknown): FineractFinancialActivityMappingListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const financialActivityData = normalizeFinancialActivityRef(row.financialActivityData);
  const glAccountData = normalizeGlAccountRef(row.glAccountData);
  if (!Number.isFinite(id) || !financialActivityData || !glAccountData) {
    return null;
  }
  return { id, financialActivityData, glAccountData };
}

export async function listFinancialActivityMappings(): Promise<
  FineractFinancialActivityMappingListItem[]
> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(FINANCIAL_ACTIVITY_ACCOUNTS_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeMappingListItem(item))
    .filter((item): item is FineractFinancialActivityMappingListItem => item !== null)
    .sort((left, right) =>
      left.financialActivityData.name.localeCompare(right.financialActivityData.name)
    );
}

export async function getFinancialActivityMappingFormTemplate(): Promise<FineractFinancialActivityMappingFormTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${FINANCIAL_ACTIVITY_ACCOUNTS_PATH}/template`);
  return normalizeFormTemplate(raw);
}

export async function getFinancialActivityMapping(
  mappingId: number
): Promise<FineractFinancialActivityMappingDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${FINANCIAL_ACTIVITY_ACCOUNTS_PATH}/${mappingId}`);
  return normalizeMappingListItem(raw);
}

export async function getFinancialActivityMappingForEdit(
  mappingId: number
): Promise<FineractFinancialActivityMappingEditData | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${FINANCIAL_ACTIVITY_ACCOUNTS_PATH}/${mappingId}`, {
    template: 'true'
  });
  const mapping = normalizeMappingListItem(raw);
  const template = normalizeFormTemplate(raw);
  if (!mapping) {
    return null;
  }
  return {
    ...mapping,
    financialActivityOptions: template.financialActivityOptions,
    glAccountOptions: template.glAccountOptions
  };
}

export async function createFinancialActivityMapping(
  input: UpsertFinancialActivityMappingFormInput
): Promise<FineractFinancialActivityMappingMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<FineractFinancialActivityMappingMutationResponse>(
    FINANCIAL_ACTIVITY_ACCOUNTS_PATH,
    buildUpsertFinancialActivityMappingPayload(input)
  );
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateFinancialActivityMapping(
  mappingId: number,
  input: UpsertFinancialActivityMappingFormInput
): Promise<FineractFinancialActivityMappingMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<FineractFinancialActivityMappingMutationResponse>(
    `${FINANCIAL_ACTIVITY_ACCOUNTS_PATH}/${mappingId}`,
    buildUpsertFinancialActivityMappingPayload(input)
  );
  return { resourceId: Number(raw?.resourceId ?? mappingId) };
}

export async function deleteFinancialActivityMapping(mappingId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${FINANCIAL_ACTIVITY_ACCOUNTS_PATH}/${mappingId}`);
}

import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption,
  FineractGlAccountDetail,
  FineractGlAccountEditData,
  FineractGlAccountFormTemplate,
  FineractGlAccountListItem,
  FineractGlAccountMutationResponse,
  FineractGlAccountRef,
  FineractGlAccountToggleResponse, FineractCommandProcessingResult } from '@mifos/api-client';
import {
  buildGlAccountApiPayload,
  type ToggleGlAccountDisabledInput,
  type UpsertGlAccountFormInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const GL_ACCOUNTS_PATH = '/glaccounts';

function normalizeEnumOption(raw: unknown): FineractEnumOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const value = typeof row.value === 'string' ? row.value : typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !value) {
    return null;
  }
  return {
    id,
    value,
    code: typeof row.code === 'string' ? row.code : undefined,
    name: typeof row.name === 'string' ? row.name : undefined
  };
}

function normalizeGlAccountRef(raw: unknown): FineractGlAccountRef | null {
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

function normalizeGlAccountListItem(raw: unknown): FineractGlAccountListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const glCode = typeof row.glCode === 'string' ? row.glCode : '';
  const type = normalizeEnumOption(row.type);
  const usage = normalizeEnumOption(row.usage);
  if (!Number.isFinite(id) || !name || !glCode || !type || !usage) {
    return null;
  }

  const tagRaw = row.tagId;
  let tagId: (FineractEnumOption & { name?: string }) | undefined;
  if (tagRaw && typeof tagRaw === 'object') {
    const tag = normalizeEnumOption(tagRaw);
    if (tag) {
      tagId = {
        ...tag,
        name: typeof (tagRaw as Record<string, unknown>).name === 'string'
          ? ((tagRaw as Record<string, unknown>).name as string)
          : tag.name
      };
    }
  }

  return {
    id,
    name,
    glCode,
    type,
    usage,
    disabled: row.disabled === true,
    manualEntriesAllowed: row.manualEntriesAllowed === true,
    parentId: Number.isFinite(Number(row.parentId)) ? Number(row.parentId) : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    tagId
  };
}

function normalizeGlAccountDetail(raw: unknown): FineractGlAccountDetail | null {
  const summary = normalizeGlAccountListItem(raw);
  if (!summary || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const parent = row.parent != null ? normalizeGlAccountRef(row.parent) : null;
  return {
    ...summary,
    ...(parent ? { parent } : {})
  };
}

function normalizeHeaderOptions(raw: unknown): FineractGlAccountRef[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeGlAccountRef(item))
    .filter((item): item is FineractGlAccountRef => item !== null);
}

function normalizeTagOptions(raw: unknown): FineractEnumOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeEnumOption(item))
    .filter((item): item is FineractEnumOption => item !== null);
}

function normalizeGlAccountFormTemplate(raw: unknown): FineractGlAccountFormTemplate {
  if (!raw || typeof raw !== 'object') {
    return {
      accountTypeOptions: [],
      usageOptions: [],
      assetHeaderAccountOptions: [],
      liabilityHeaderAccountOptions: [],
      equityHeaderAccountOptions: [],
      incomeHeaderAccountOptions: [],
      expenseHeaderAccountOptions: []
    };
  }
  const row = raw as Record<string, unknown>;
  return {
    accountTypeOptions: Array.isArray(row.accountTypeOptions)
      ? row.accountTypeOptions
          .map((item) => normalizeEnumOption(item))
          .filter((item): item is FineractEnumOption => item !== null)
      : [],
    usageOptions: Array.isArray(row.usageOptions)
      ? row.usageOptions
          .map((item) => normalizeEnumOption(item))
          .filter((item): item is FineractEnumOption => item !== null)
      : [],
    assetHeaderAccountOptions: normalizeHeaderOptions(row.assetHeaderAccountOptions),
    liabilityHeaderAccountOptions: normalizeHeaderOptions(row.liabilityHeaderAccountOptions),
    equityHeaderAccountOptions: normalizeHeaderOptions(row.equityHeaderAccountOptions),
    incomeHeaderAccountOptions: normalizeHeaderOptions(row.incomeHeaderAccountOptions),
    expenseHeaderAccountOptions: normalizeHeaderOptions(row.expenseHeaderAccountOptions),
    allowedAssetsTagOptions: normalizeTagOptions(row.allowedAssetsTagOptions),
    allowedLiabilitiesTagOptions: normalizeTagOptions(row.allowedLiabilitiesTagOptions),
    allowedEquityTagOptions: normalizeTagOptions(row.allowedEquityTagOptions),
    allowedIncomeTagOptions: normalizeTagOptions(row.allowedIncomeTagOptions),
    allowedExpensesTagOptions: normalizeTagOptions(row.allowedExpensesTagOptions)
  };
}

function mergeGlAccountEditData(raw: unknown): FineractGlAccountEditData | null {
  const detail = normalizeGlAccountDetail(raw);
  if (!detail) {
    return null;
  }
  const template = normalizeGlAccountFormTemplate(raw);
  return { ...detail, ...template };
}

export async function getGlAccountFormTemplate(): Promise<FineractGlAccountFormTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${GL_ACCOUNTS_PATH}/template`);
  return normalizeGlAccountFormTemplate(raw);
}

export async function listGlAccounts(): Promise<FineractGlAccountListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(GL_ACCOUNTS_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeGlAccountListItem(item))
    .filter((item): item is FineractGlAccountListItem => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getGlAccount(glAccountId: number): Promise<FineractGlAccountEditData | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${GL_ACCOUNTS_PATH}/${glAccountId}`, { template: 'true' });
  return mergeGlAccountEditData(raw);
}

export async function createGlAccount(
  input: UpsertGlAccountFormInput
): Promise<FineractGlAccountMutationResponse> {
  const fineract = await createFineractClient();
  const payload = buildGlAccountApiPayload(input);
  const raw = await fineract.post<FineractGlAccountMutationResponse>(GL_ACCOUNTS_PATH, payload);
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateGlAccount(
  glAccountId: number,
  input: UpsertGlAccountFormInput
): Promise<FineractGlAccountMutationResponse> {
  const fineract = await createFineractClient();
  const payload = buildGlAccountApiPayload(input);
  const raw = await fineract.put<FineractGlAccountMutationResponse>(
    `${GL_ACCOUNTS_PATH}/${glAccountId}`,
    payload
  );
  return { resourceId: Number(raw?.resourceId ?? glAccountId) };
}

export async function toggleGlAccountDisabled(
  glAccountId: number,
  input: ToggleGlAccountDisabledInput
): Promise<FineractGlAccountToggleResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<FineractGlAccountToggleResponse>(
    `${GL_ACCOUNTS_PATH}/${glAccountId}`,
    input
  );
  return {
    resourceId: Number(raw?.resourceId ?? glAccountId),
    changes: { disabled: raw?.changes?.disabled === true }
  };
}

export async function deleteGlAccount(glAccountId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${GL_ACCOUNTS_PATH}/${glAccountId}`);
}

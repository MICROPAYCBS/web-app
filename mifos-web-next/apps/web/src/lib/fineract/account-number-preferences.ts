import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountNumberPreferenceDetail,
  FineractAccountNumberPreferenceListItem,
  FineractAccountNumberPreferenceMutationResponse,
  FineractAccountNumberPreferenceOption,
  FineractAccountNumberPreferenceTemplate, FineractCommandProcessingResult } from '@mifos/api-client';
import {
  buildCreateAccountNumberPreferencePayload,
  buildUpdateAccountNumberPreferencePayload,
  type CreateAccountNumberPreferenceInput,
  type UpdateAccountNumberPreferenceInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const ACCOUNT_NUMBER_FORMATS_PATH = '/accountnumberformats';

function normalizeOption(raw: unknown): FineractAccountNumberPreferenceOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const value = typeof row.value === 'string' ? row.value : '';
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    value,
    code: typeof row.code === 'string' ? row.code : undefined
  };
}

function normalizeListItem(raw: unknown): FineractAccountNumberPreferenceListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const accountType = normalizeOption(row.accountType);
  if (!Number.isFinite(id) || !accountType) {
    return null;
  }
  const prefixType = normalizeOption(row.prefixType) ?? undefined;
  return {
    id,
    accountType,
    prefixType
  };
}

function normalizePrefixTypeOptions(raw: unknown): Record<string, FineractAccountNumberPreferenceOption[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const options: Record<string, FineractAccountNumberPreferenceOption[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) {
      continue;
    }
    options[key] = value
      .map((item) => normalizeOption(item))
      .filter((item): item is FineractAccountNumberPreferenceOption => item !== null);
  }
  return options;
}

function normalizeTemplate(raw: unknown): FineractAccountNumberPreferenceTemplate {
  if (!raw || typeof raw !== 'object') {
    return { accountTypeOptions: [], prefixTypeOptions: {} };
  }
  const row = raw as Record<string, unknown>;
  return {
    accountTypeOptions: Array.isArray(row.accountTypeOptions)
      ? row.accountTypeOptions
          .map((item) => normalizeOption(item))
          .filter((item): item is FineractAccountNumberPreferenceOption => item !== null)
      : [],
    prefixTypeOptions: normalizePrefixTypeOptions(row.prefixTypeOptions)
  };
}

export async function listAccountNumberPreferences(): Promise<FineractAccountNumberPreferenceListItem[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<unknown[]>(ACCOUNT_NUMBER_FORMATS_PATH);
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => normalizeListItem(row))
    .filter((row): row is FineractAccountNumberPreferenceListItem => row !== null)
    .sort((left, right) =>
      left.accountType.value.localeCompare(right.accountType.value, undefined, { sensitivity: 'base' })
    );
}

export async function getAccountNumberPreferenceTemplate(): Promise<FineractAccountNumberPreferenceTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${ACCOUNT_NUMBER_FORMATS_PATH}/template`);
  return normalizeTemplate(raw);
}

export async function getAccountNumberPreference(
  preferenceId: number
): Promise<FineractAccountNumberPreferenceDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${ACCOUNT_NUMBER_FORMATS_PATH}/${preferenceId}`);
  return normalizeListItem(raw);
}

export async function createAccountNumberPreference(
  input: CreateAccountNumberPreferenceInput
): Promise<FineractAccountNumberPreferenceMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractAccountNumberPreferenceMutationResponse>(
    ACCOUNT_NUMBER_FORMATS_PATH,
    buildCreateAccountNumberPreferencePayload(input)
  );
}

export async function updateAccountNumberPreference(
  preferenceId: number,
  input: UpdateAccountNumberPreferenceInput
): Promise<FineractAccountNumberPreferenceMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractAccountNumberPreferenceMutationResponse>(
    `${ACCOUNT_NUMBER_FORMATS_PATH}/${preferenceId}`,
    buildUpdateAccountNumberPreferencePayload(input)
  );
}

export async function deleteAccountNumberPreference(preferenceId: number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`${ACCOUNT_NUMBER_FORMATS_PATH}/${preferenceId}`);
}

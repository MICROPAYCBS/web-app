import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractGlobalConfiguration,
  FineractGlobalConfigurationListResponse,
  FineractGlobalConfigurationUpdateResponse
} from '@mifos/api-client';
import type {
  UpdateGlobalConfigurationEnabledInput,
  UpdateGlobalConfigurationValuesInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const CONFIGURATIONS_PATH = '/configurations';

function normalizeGlobalConfiguration(raw: unknown): FineractGlobalConfiguration | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }

  return {
    id,
    name,
    enabled: row.enabled === true,
    value:
      row.value == null || row.value === ''
        ? null
        : Number.isFinite(Number(row.value))
          ? Number(row.value)
          : null,
    stringValue: typeof row.stringValue === 'string' ? row.stringValue : null,
    dateValue:
      typeof row.dateValue === 'string' || Array.isArray(row.dateValue)
        ? (row.dateValue as string | number[])
        : null,
    description: typeof row.description === 'string' ? row.description : null,
    trapDoor: row.trapDoor === true
  };
}

function normalizeGlobalConfigurationList(raw: unknown): FineractGlobalConfiguration[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const row = raw as FineractGlobalConfigurationListResponse;
  if (!Array.isArray(row.globalConfiguration)) {
    return [];
  }
  return row.globalConfiguration
    .map((item) => normalizeGlobalConfiguration(item))
    .filter((item): item is FineractGlobalConfiguration => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listGlobalConfigurations(): Promise<FineractGlobalConfiguration[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(CONFIGURATIONS_PATH);
  return normalizeGlobalConfigurationList(raw);
}

export async function getGlobalConfiguration(
  configurationId: number
): Promise<FineractGlobalConfiguration | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${CONFIGURATIONS_PATH}/${configurationId}`);
  return normalizeGlobalConfiguration(raw);
}

export async function updateGlobalConfigurationEnabled(
  input: UpdateGlobalConfigurationEnabledInput
): Promise<FineractGlobalConfigurationUpdateResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractGlobalConfigurationUpdateResponse>(
    `${CONFIGURATIONS_PATH}/${input.id}`,
    { enabled: input.enabled }
  );
}

export async function updateGlobalConfigurationValues(
  input: UpdateGlobalConfigurationValuesInput
): Promise<FineractGlobalConfigurationUpdateResponse> {
  const fineract = await createFineractClient();
  const payload: Record<string, unknown> = {};

  if (input.value != null) {
    payload.value = input.value;
  }
  if (input.stringValue) {
    payload.stringValue = input.stringValue;
  }
  if (input.dateValue) {
    payload.dateValue = input.dateValue;
    payload.dateFormat = input.dateFormat;
    payload.locale = input.locale;
  }

  return fineract.put<FineractGlobalConfigurationUpdateResponse>(
    `${CONFIGURATIONS_PATH}/${input.id}`,
    payload
  );
}

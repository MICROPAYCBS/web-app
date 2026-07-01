import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalServiceName,
  FineractExternalServiceProperty, FineractCommandProcessingResult } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeExternalServiceProperty(raw: unknown): FineractExternalServiceProperty | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!name) {
    return null;
  }
  const value =
    row.value == null
      ? ''
      : typeof row.value === 'boolean'
        ? String(row.value)
        : String(row.value);
  return { name, value };
}

export function normalizeExternalServiceConfiguration(
  raw: unknown
): FineractExternalServiceProperty[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeExternalServiceProperty(item))
    .filter((item): item is FineractExternalServiceProperty => item !== null);
}

export async function getExternalServiceConfiguration(
  serviceName: FineractExternalServiceName
): Promise<FineractExternalServiceProperty[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/externalservice/${serviceName}`);
  return normalizeExternalServiceConfiguration(raw);
}

export async function updateExternalServiceConfiguration(
  serviceName: FineractExternalServiceName,
  payload: Record<string, string | boolean>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCommandProcessingResult>(`/externalservice/${serviceName}`, payload);
}

const ALL_EXTERNAL_SERVICE_NAMES: FineractExternalServiceName[] = [
  'S3',
  'SMTP',
  'SMS',
  'NOTIFICATION'
];

export async function listAllExternalServiceConfigurations(): Promise<
  Record<FineractExternalServiceName, FineractExternalServiceProperty[]>
> {
  const entries = await Promise.all(
    ALL_EXTERNAL_SERVICE_NAMES.map(async (serviceName) => {
      const properties = await getExternalServiceConfiguration(serviceName);
      return [serviceName, properties] as const;
    })
  );
  return Object.fromEntries(entries) as Record<
    FineractExternalServiceName,
    FineractExternalServiceProperty[]
  >;
}

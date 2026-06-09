import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractExternalEventConfigurationItem,
  FineractExternalEventConfigurationResponse
} from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

const CONFIG_PATH = '/externalevents/configuration';

function normalizeExternalEventConfiguration(
  raw: unknown
): FineractExternalEventConfigurationItem[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }
  const row = raw as FineractExternalEventConfigurationResponse;
  if (!Array.isArray(row.externalEventConfiguration)) {
    return [];
  }
  return row.externalEventConfiguration
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const event = item as { type?: unknown; enabled?: unknown };
      const type = typeof event.type === 'string' ? event.type : undefined;
      if (!type) {
        return null;
      }
      return {
        type,
        enabled: event.enabled === true
      };
    })
    .filter((item): item is FineractExternalEventConfigurationItem => item !== null)
    .sort((left, right) => left.type.localeCompare(right.type));
}

export async function listExternalEventConfiguration(): Promise<
  FineractExternalEventConfigurationItem[]
> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(CONFIG_PATH);
  return normalizeExternalEventConfiguration(raw);
}

export async function updateExternalEventConfiguration(
  externalEventConfigurations: Record<string, boolean>
): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.put(CONFIG_PATH, { externalEventConfigurations });
}

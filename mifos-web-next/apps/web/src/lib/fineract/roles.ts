import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { EntityMappingOption } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeNamedOptions(raw: unknown): EntityMappingOption[] {
  if (!Array.isArray(raw)) {
    if (raw && typeof raw === 'object' && Array.isArray((raw as { pageItems?: unknown }).pageItems)) {
      return normalizeNamedOptions((raw as { pageItems: unknown[] }).pageItems);
    }
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const name =
        typeof row.name === 'string'
          ? row.name.trim()
          : typeof row.nameDecorated === 'string'
            ? row.nameDecorated.trim()
            : '';
      if (!Number.isFinite(id) || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is EntityMappingOption => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listRoleOptions(): Promise<EntityMappingOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/roles');
  return normalizeNamedOptions(raw);
}

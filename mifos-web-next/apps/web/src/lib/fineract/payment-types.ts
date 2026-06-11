import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractPaymentTypeOption } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizePaymentType(raw: unknown): FineractPaymentTypeOption | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return { id, name };
}

export async function listPaymentTypes(): Promise<FineractPaymentTypeOption[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/paymenttypes');
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizePaymentType(item))
    .filter((item): item is FineractPaymentTypeOption => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

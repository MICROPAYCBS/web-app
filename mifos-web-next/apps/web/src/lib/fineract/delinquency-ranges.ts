import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DelinquencyMutationResponse,
  DelinquencyRangeDetail,
  DelinquencyRangeListItem
} from '@mifos/api-client';
import type {
  CreateDelinquencyRangeInput,
  UpdateDelinquencyRangeInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';

export function normalizeDelinquencyRangeItem(item: unknown): DelinquencyRangeListItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    classification: typeof row.classification === 'string' ? row.classification : undefined,
    minimumAgeDays:
      typeof row.minimumAgeDays === 'number'
        ? row.minimumAgeDays
        : row.minimumAgeDays !== undefined
          ? Number(row.minimumAgeDays)
          : undefined,
    maximumAgeDays:
      typeof row.maximumAgeDays === 'number'
        ? row.maximumAgeDays
        : row.maximumAgeDays !== undefined && row.maximumAgeDays !== null
          ? Number(row.maximumAgeDays)
          : undefined
  };
}

function normalizeList(value: unknown): DelinquencyRangeListItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeDelinquencyRangeItem(item))
    .filter((item): item is DelinquencyRangeListItem => item !== null);
}

function createPayload(input: CreateDelinquencyRangeInput | UpdateDelinquencyRangeInput) {
  const payload: Record<string, unknown> = {
    classification: input.classification,
    minimumAgeDays: input.minimumAgeDays,
    locale: FINERACT_LOCALE
  };
  if (input.maximumAgeDays !== undefined) {
    payload.maximumAgeDays = input.maximumAgeDays;
  }
  return payload;
}

export async function listDelinquencyRanges(): Promise<DelinquencyRangeListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/delinquency/ranges');
  return normalizeList(data);
}

export async function getDelinquencyRange(
  rangeId: string | number
): Promise<DelinquencyRangeDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/delinquency/ranges/${rangeId}`);
  const item = normalizeDelinquencyRangeItem(raw);
  if (!item) {
    throw new Error('Delinquency range not found.');
  }
  return item;
}

export async function createDelinquencyRange(
  input: CreateDelinquencyRangeInput
): Promise<DelinquencyMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<DelinquencyMutationResponse>('/delinquency/ranges', createPayload(input));
}

export async function updateDelinquencyRange(
  rangeId: string | number,
  input: UpdateDelinquencyRangeInput
): Promise<DelinquencyMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<DelinquencyMutationResponse>(
    `/delinquency/ranges/${rangeId}`,
    createPayload(input)
  );
}

export async function deleteDelinquencyRange(rangeId: string | number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`/delinquency/ranges/${rangeId}`);
}

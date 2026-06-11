import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FloatingRateDetail,
  FloatingRateListItem,
  FloatingRateMutationResponse,
  FloatingRatePeriod
} from '@mifos/api-client';
import type { FloatingRatePeriodInput, UpsertFloatingRateInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fineractApiDateToFormString,
  normalizeFineractDateField
} from '@/lib/fineract/dates';

function normalizePeriod(item: unknown): FloatingRatePeriod | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id = row.id !== undefined ? Number(row.id) : undefined;
  return {
    id: id !== undefined && Number.isFinite(id) ? id : undefined,
    fromDate: Array.isArray(row.fromDate)
      ? (row.fromDate as number[])
      : typeof row.fromDate === 'string'
        ? row.fromDate
        : undefined,
    interestRate:
      typeof row.interestRate === 'number'
        ? row.interestRate
        : row.interestRate !== undefined
          ? Number(row.interestRate)
          : undefined,
    isDifferentialToBaseLendingRate:
      typeof row.isDifferentialToBaseLendingRate === 'boolean'
        ? row.isDifferentialToBaseLendingRate
        : undefined,
    isActive: typeof row.isActive === 'boolean' ? row.isActive : undefined,
    createdBy: typeof row.createdBy === 'string' ? row.createdBy : undefined,
    createdOn: Array.isArray(row.createdOn)
      ? (row.createdOn as number[])
      : typeof row.createdOn === 'string'
        ? row.createdOn
        : undefined,
    modifiedBy: typeof row.modifiedBy === 'string' ? row.modifiedBy : undefined,
    modifiedOn: Array.isArray(row.modifiedOn)
      ? (row.modifiedOn as number[])
      : typeof row.modifiedOn === 'string'
        ? row.modifiedOn
        : undefined
  };
}

function normalizeListItem(item: unknown): FloatingRateListItem | null {
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
    name: typeof row.name === 'string' ? row.name : undefined,
    createdBy: typeof row.createdBy === 'string' ? row.createdBy : undefined,
    isBaseLendingRate:
      typeof row.isBaseLendingRate === 'boolean' ? row.isBaseLendingRate : undefined,
    isActive: typeof row.isActive === 'boolean' ? row.isActive : undefined
  };
}

function normalizeList(value: unknown): FloatingRateListItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeListItem(item))
      .filter((item): item is FloatingRateListItem => item !== null);
  }
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    if (Array.isArray(row.pageItems)) {
      return normalizeList(row.pageItems);
    }
    if (Array.isArray(row.floatingRates)) {
      return normalizeList(row.floatingRates);
    }
  }
  return [];
}

function normalizeDetail(raw: unknown): FloatingRateDetail | null {
  const listItem = normalizeListItem(raw);
  if (!listItem) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const ratePeriods = Array.isArray(row.ratePeriods)
    ? row.ratePeriods
        .map((item) => normalizePeriod(item))
        .filter((item): item is FloatingRatePeriod => item !== null)
    : [];
  return {
    ...listItem,
    ratePeriods
  };
}

function periodPayload(period: FloatingRatePeriodInput) {
  return {
    fromDate: normalizeFineractDateField(period.fromDate),
    interestRate: period.interestRate,
    isDifferentialToBaseLendingRate: period.isDifferentialToBaseLendingRate ?? false,
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  };
}

function upsertPayload(input: UpsertFloatingRateInput, forUpdate: boolean) {
  const payload: Record<string, unknown> = {
    name: input.name,
    isBaseLendingRate: input.isBaseLendingRate ?? false,
    isActive: input.isActive ?? false
  };

  const periods = input.ratePeriods ?? [];
  if (periods.length > 0) {
    payload.ratePeriods = periods.map((period) => periodPayload(period));
  } else if (!forUpdate) {
    payload.ratePeriods = [];
  }

  return payload;
}

export async function listFloatingRates(): Promise<FloatingRateListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/floatingrates');
  return normalizeList(data);
}

export async function getFloatingRate(
  floatingRateId: string | number
): Promise<FloatingRateDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/floatingrates/${floatingRateId}`);
  const item = normalizeDetail(raw);
  if (!item) {
    throw new Error('Floating rate not found.');
  }
  return item;
}

export async function createFloatingRate(
  input: UpsertFloatingRateInput
): Promise<FloatingRateMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FloatingRateMutationResponse>(
    '/floatingrates',
    upsertPayload(input, false)
  );
}

export async function updateFloatingRate(
  floatingRateId: string | number,
  input: UpsertFloatingRateInput
): Promise<FloatingRateMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FloatingRateMutationResponse>(
    `/floatingrates/${floatingRateId}`,
    upsertPayload(input, true)
  );
}

export function floatingRatePeriodFormDate(
  value: number[] | string | undefined
): string | undefined {
  return fineractApiDateToFormString(value);
}

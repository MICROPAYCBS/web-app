import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyBucketDetail,
  DelinquencyBucketListItem,
  DelinquencyBucketRangeRef,
  DelinquencyBucketTemplate,
  DelinquencyMinimumPaymentRule,
  DelinquencyMutationResponse,
  DelinquencyStringEnumOption,
  FineractEnumOption, FineractCommandProcessingResult } from '@mifos/api-client';
import type {
  CreateDelinquencyBucketInput,
  UpdateDelinquencyBucketInput
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  listDelinquencyRanges,
  normalizeDelinquencyRangeItem
} from '@/lib/fineract/delinquency-ranges';

function normalizeEnumOption(raw: unknown): FineractEnumOption | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    if (typeof row.id === 'string' && row.id) {
      return {
        id: 0,
        code: typeof row.code === 'string' ? row.code : undefined,
        value: typeof row.value === 'string' ? row.value : row.id
      };
    }
    return undefined;
  }
  return {
    id,
    code: typeof row.code === 'string' ? row.code : undefined,
    value: typeof row.value === 'string' ? row.value : undefined
  };
}

function normalizeStringEnumOption(raw: unknown): DelinquencyStringEnumOption | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = row.id;
  if (typeof id !== 'string' && typeof id !== 'number') {
    return undefined;
  }
  return {
    id: String(id),
    code: typeof row.code === 'string' ? row.code : undefined,
    value: typeof row.value === 'string' ? row.value : undefined
  };
}

function normalizeBucketRange(raw: unknown): DelinquencyBucketRangeRef | null {
  const range = normalizeDelinquencyRangeItem(raw);
  return range;
}

function normalizeOptionField(raw: unknown): FineractEnumOption | DelinquencyStringEnumOption | undefined {
  return normalizeStringEnumOption(raw) ?? normalizeEnumOption(raw);
}

function normalizeMinimumPaymentRule(raw: unknown): DelinquencyMinimumPaymentRule | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  return {
    frequency:
      typeof row.frequency === 'number'
        ? row.frequency
        : row.frequency !== undefined
          ? Number(row.frequency)
          : undefined,
    frequencyType: normalizeOptionField(row.frequencyType),
    minimumPayment:
      typeof row.minimumPayment === 'number'
        ? row.minimumPayment
        : row.minimumPayment !== undefined
          ? Number(row.minimumPayment)
          : undefined,
    minimumPaymentType: normalizeOptionField(row.minimumPaymentType)
  };
}

function normalizeBucketListItem(item: unknown): DelinquencyBucketListItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const row = item as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  const bucketTypeRaw = row.bucketType;
  let bucketType: DelinquencyBucketListItem['bucketType'];
  if (bucketTypeRaw && typeof bucketTypeRaw === 'object') {
    const bucketRow = bucketTypeRaw as Record<string, unknown>;
    bucketType = {
      id: bucketRow.id as string | number | undefined,
      code: typeof bucketRow.code === 'string' ? bucketRow.code : undefined,
      value: typeof bucketRow.value === 'string' ? bucketRow.value : undefined
    };
  }
  return {
    id,
    name: typeof row.name === 'string' ? row.name : undefined,
    bucketType
  };
}

function normalizeBucketDetail(raw: unknown): DelinquencyBucketDetail | null {
  const listItem = normalizeBucketListItem(raw);
  if (!listItem) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const ranges = Array.isArray(row.ranges)
    ? row.ranges
        .map((item) => normalizeBucketRange(item))
        .filter((item): item is DelinquencyBucketRangeRef => item !== null)
    : [];
  return {
    ...listItem,
    ranges,
    minimumPaymentPeriodAndRule: normalizeMinimumPaymentRule(row.minimumPaymentPeriodAndRule)
  };
}

function normalizeTemplate(raw: unknown): DelinquencyBucketTemplate {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const mapRanges = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => normalizeDelinquencyRangeItem(item))
          .filter(
            (item): item is NonNullable<ReturnType<typeof normalizeDelinquencyRangeItem>> =>
              item !== null
          )
      : undefined;
  const mapStringOptions = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => normalizeStringEnumOption(item))
          .filter((item): item is DelinquencyStringEnumOption => item !== undefined)
      : undefined;

  return {
    ranges: mapRanges(row.ranges),
    rangesOptions: mapRanges(row.rangesOptions),
    frequencyTypeOptions: mapStringOptions(row.frequencyTypeOptions),
    minimumPaymentOptions: mapStringOptions(row.minimumPaymentOptions)
  };
}

function bucketPayload(input: CreateDelinquencyBucketInput | UpdateDelinquencyBucketInput) {
  if (input.bucketType === 'REGULAR') {
    return {
      bucketType: input.bucketType,
      name: input.name,
      ranges: input.ranges
    };
  }

  return {
    bucketType: input.bucketType,
    name: input.name,
    minimumPaymentPeriodAndRule: {
      name: input.name,
      frequency: input.frequency,
      frequencyType: input.frequencyType,
      minimumPayment: input.minimumPayment,
      minimumPaymentType: input.minimumPaymentType
    },
    ranges: input.ranges
  };
}

export async function listDelinquencyBuckets(): Promise<DelinquencyBucketListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/delinquency/buckets');
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((item) => normalizeBucketListItem(item))
    .filter((item): item is DelinquencyBucketListItem => item !== null);
}

export async function getDelinquencyBucketTemplate(): Promise<DelinquencyBucketTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/delinquency/buckets/template');
  return normalizeTemplate(raw);
}

export async function getDelinquencyBucket(
  bucketId: string | number
): Promise<DelinquencyBucketDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/delinquency/buckets/${bucketId}`);
  const item = normalizeBucketDetail(raw);
  if (!item) {
    throw new Error('Delinquency bucket not found.');
  }
  return item;
}

export async function getDelinquencyBucketFormOptions(
  bucketType: 'regular' | 'workingcapital'
): Promise<{
  rangeOptions: DelinquencyBucketTemplate['rangesOptions'];
  frequencyTypeOptions: DelinquencyStringEnumOption[];
  minimumPaymentOptions: DelinquencyStringEnumOption[];
}> {
  if (bucketType === 'workingcapital') {
    const template = await getDelinquencyBucketTemplate();
    return {
      rangeOptions: template.rangesOptions ?? [],
      frequencyTypeOptions: template.frequencyTypeOptions ?? [],
      minimumPaymentOptions: template.minimumPaymentOptions ?? []
    };
  }

  const ranges = await listDelinquencyRanges();
  return {
    rangeOptions: ranges,
    frequencyTypeOptions: [],
    minimumPaymentOptions: []
  };
}

export async function createDelinquencyBucket(
  input: CreateDelinquencyBucketInput
): Promise<DelinquencyMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<DelinquencyMutationResponse>('/delinquency/buckets', bucketPayload(input));
}

export async function updateDelinquencyBucket(
  bucketId: string | number,
  input: UpdateDelinquencyBucketInput
): Promise<DelinquencyMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<DelinquencyMutationResponse>(
    `/delinquency/buckets/${bucketId}`,
    bucketPayload(input)
  );
}

export async function deleteDelinquencyBucket(bucketId: string | number): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/delinquency/buckets/${bucketId}`);
}

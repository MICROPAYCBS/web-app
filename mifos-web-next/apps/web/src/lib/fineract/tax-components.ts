import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEnumOption,
  FineractGlAccountRef,
  TaxComponentDetail,
  TaxComponentGlAccountOptions,
  TaxComponentListItem,
  TaxComponentTemplate,
  TaxMutationResponse
} from '@mifos/api-client';
import type { CreateTaxComponentInput, UpdateTaxComponentInput } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';

function normalizeEnumOption(raw: unknown): FineractEnumOption | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isFinite(id)) {
    return undefined;
  }
  return {
    id,
    code: typeof row.code === 'string' ? row.code : undefined,
    value: typeof row.value === 'string' ? row.value : undefined
  };
}

function normalizeGlAccountRef(raw: unknown): FineractGlAccountRef | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  const glCode = typeof row.glCode === 'string' ? row.glCode : '';
  if (!Number.isFinite(id) || !name || !glCode) {
    return undefined;
  }
  return { id, name, glCode };
}

function normalizeGlAccountOptions(raw: unknown): TaxComponentGlAccountOptions {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const mapOptions = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => normalizeGlAccountRef(item))
          .filter((item): item is FineractGlAccountRef => item !== undefined)
      : undefined;

  return {
    assetAccountOptions: mapOptions(row.assetAccountOptions),
    liabilityAccountOptions: mapOptions(row.liabilityAccountOptions),
    equityAccountOptions: mapOptions(row.equityAccountOptions),
    incomeAccountOptions: mapOptions(row.incomeAccountOptions),
    expenseAccountOptions: mapOptions(row.expenseAccountOptions)
  };
}

function normalizeListItem(item: unknown): TaxComponentListItem | null {
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
    percentage: typeof row.percentage === 'number' ? row.percentage : undefined,
    creditAccountType: normalizeEnumOption(row.creditAccountType),
    creditAccount: normalizeGlAccountRef(row.creditAccount),
    debitAccountType: normalizeEnumOption(row.debitAccountType),
    debitAccount: normalizeGlAccountRef(row.debitAccount),
    startDate: Array.isArray(row.startDate)
      ? (row.startDate as number[])
      : typeof row.startDate === 'string'
        ? row.startDate
        : undefined
  };
}

function normalizeList(value: unknown): TaxComponentListItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeListItem(item))
      .filter((item): item is TaxComponentListItem => item !== null);
  }
  return [];
}

function normalizeTemplate(raw: unknown): TaxComponentTemplate {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    glAccountTypeOptions: Array.isArray(row.glAccountTypeOptions)
      ? row.glAccountTypeOptions
          .map((item) => normalizeEnumOption(item))
          .filter((item): item is FineractEnumOption => item !== undefined)
      : [],
    glAccountOptions: normalizeGlAccountOptions(row.glAccountOptions)
  };
}

function createPayload(input: CreateTaxComponentInput) {
  const payload: Record<string, unknown> = {
    name: input.name,
    percentage: String(input.percentage),
    startDate: normalizeFineractDateField(input.startDate),
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  };
  if (input.debitAccountType) {
    payload.debitAccountType = input.debitAccountType;
  }
  if (input.debitAccountId) {
    payload.debitAccountId = input.debitAccountId;
  }
  if (input.creditAccountType) {
    payload.creditAccountType = input.creditAccountType;
  }
  if (input.creditAccountId) {
    payload.creditAccountId = input.creditAccountId;
  }
  return payload;
}

function updatePayload(input: UpdateTaxComponentInput) {
  return {
    name: input.name,
    percentage: String(input.percentage),
    startDate: normalizeFineractDateField(input.startDate),
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  };
}

export async function listTaxComponents(): Promise<TaxComponentListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<unknown>('/taxes/component');
  return normalizeList(data);
}

export async function getTaxComponentTemplate(): Promise<TaxComponentTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>('/taxes/component/template');
  return normalizeTemplate(raw);
}

export async function getTaxComponent(taxComponentId: string | number): Promise<TaxComponentDetail> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`/taxes/component/${taxComponentId}`);
  const item = normalizeListItem(raw);
  if (!item) {
    throw new Error('Tax component not found.');
  }
  return item;
}

export async function createTaxComponent(
  input: CreateTaxComponentInput
): Promise<TaxMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<TaxMutationResponse>('/taxes/component', createPayload(input));
}

export async function updateTaxComponent(
  taxComponentId: string | number,
  input: UpdateTaxComponentInput
): Promise<TaxMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<TaxMutationResponse>(
    `/taxes/component/${taxComponentId}`,
    updatePayload(input)
  );
}

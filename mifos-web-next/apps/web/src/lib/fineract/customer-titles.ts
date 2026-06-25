import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CustomerTitle,
  CustomerTitleMutationResponse,
  CustomerTitleTemplate
} from '@mifos/api-client';
import {
  buildUpdateCustomerTitlePayload,
  buildUpsertCustomerTitlePayload,
  type CustomerTitleUpdateClearFields,
  type UpdateCustomerTitlePayload,
  type UpsertCustomerTitlePayload
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/clienttitles';

function normalizeCustomerTitle(raw: unknown): CustomerTitle | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const titleCode = typeof row.titleCode === 'string' ? row.titleCode : '';
  const titleName = typeof row.titleName === 'string' ? row.titleName : '';
  if (!Number.isFinite(id) || !titleCode || !titleName) {
    return null;
  }
  return {
    id,
    titleCode,
    titleName,
    genderId: row.genderId != null ? Number(row.genderId) : null,
    displayOrder: row.displayOrder != null ? Number(row.displayOrder) : undefined,
    status: typeof row.status === 'string' ? row.status : undefined
  };
}

function normalizeTemplate(raw: unknown): CustomerTitleTemplate {
  if (!raw || typeof raw !== 'object') {
    return { genderOptions: [], statusOptions: [] };
  }
  const row = raw as Record<string, unknown>;
  const genderOptions = Array.isArray(row.genderOptions)
    ? row.genderOptions
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }
          const option = item as Record<string, unknown>;
          const id = Number(option.id);
          const name =
            (typeof option.name === 'string' && option.name) ||
            (typeof option.value === 'string' && option.value) ||
            '';
          return Number.isFinite(id) && name ? { id, name } : null;
        })
        .filter((item): item is { id: number; name: string } => item !== null)
    : [];
  const statusOptions = Array.isArray(row.statusOptions)
    ? row.statusOptions.filter((item): item is string => typeof item === 'string')
    : [];
  return { genderOptions, statusOptions };
}

export async function listCustomerTitles(): Promise<CustomerTitle[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeCustomerTitle(item))
    .filter((item): item is CustomerTitle => item !== null)
    .sort((left, right) => {
      const orderDiff = (left.displayOrder ?? 0) - (right.displayOrder ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return left.titleName.localeCompare(right.titleName);
    });
}

export async function getCustomerTitleTemplate(): Promise<CustomerTitleTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/template`);
  return normalizeTemplate(raw);
}

export async function getCustomerTitle(customerTitleId: number): Promise<CustomerTitle | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${customerTitleId}`);
  return normalizeCustomerTitle(raw);
}

export async function createCustomerTitle(
  input: UpsertCustomerTitlePayload
): Promise<CustomerTitleMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.post<CustomerTitleMutationResponse>(
    BASE_PATH,
    buildUpsertCustomerTitlePayload(input)
  );
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateCustomerTitle(
  customerTitleId: number,
  input: UpdateCustomerTitlePayload,
  clear: CustomerTitleUpdateClearFields
): Promise<CustomerTitleMutationResponse> {
  const fineract = await createFineractClient();
  const raw = await fineract.put<CustomerTitleMutationResponse>(
    `${BASE_PATH}/${customerTitleId}`,
    buildUpdateCustomerTitlePayload(input, clear)
  );
  return { resourceId: Number(raw?.resourceId ?? customerTitleId) };
}

export async function deleteCustomerTitle(customerTitleId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${BASE_PATH}/${customerTitleId}`);
}

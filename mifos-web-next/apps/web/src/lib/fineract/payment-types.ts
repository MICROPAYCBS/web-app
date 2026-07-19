import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractPaymentTypeOption,
  OrganizationPaymentType,
  OrganizationPaymentTypeMutationResponse
} from '@mifos/api-client';
import type {
  CreatePaymentTypePayload,
  UpdatePaymentTypePayload,
  UpdateSystemPaymentTypePayload
} from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/paymenttypes';

export function normalizeOrganizationPaymentType(raw: unknown): OrganizationPaymentType | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const name = typeof row.name === 'string' ? row.name : '';
  if (!Number.isFinite(id) || !name) {
    return null;
  }
  return {
    id,
    name,
    description: typeof row.description === 'string' ? row.description : undefined,
    codeName: typeof row.codeName === 'string' ? row.codeName : undefined,
    isSystemDefined: row.isSystemDefined === true,
    isCashPayment: row.isCashPayment === true,
    position:
      typeof row.position === 'number'
        ? row.position
        : row.position !== undefined
          ? Number(row.position)
          : undefined
  };
}

function normalizeList(value: unknown): OrganizationPaymentType[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeOrganizationPaymentType(item))
    .filter((item): item is OrganizationPaymentType => item !== null)
    .sort((left, right) => {
      const leftPosition = left.position ?? Number.MAX_SAFE_INTEGER;
      const rightPosition = right.position ?? Number.MAX_SAFE_INTEGER;
      if (leftPosition !== rightPosition) {
        return leftPosition - rightPosition;
      }
      return left.name.localeCompare(right.name);
    });
}

export async function listOrganizationPaymentTypes(): Promise<OrganizationPaymentType[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  return normalizeList(raw);
}

export async function getOrganizationPaymentType(
  paymentTypeId: string | number
): Promise<OrganizationPaymentType> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${paymentTypeId}`);
  const paymentType = normalizeOrganizationPaymentType(raw);
  if (!paymentType) {
    throw new Error('Payment type not found.');
  }
  return paymentType;
}

export async function createOrganizationPaymentType(
  input: CreatePaymentTypePayload
): Promise<OrganizationPaymentTypeMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<OrganizationPaymentTypeMutationResponse>(BASE_PATH, input);
}

export async function updateOrganizationPaymentType(
  paymentTypeId: string | number,
  input: UpdatePaymentTypePayload | UpdateSystemPaymentTypePayload
): Promise<OrganizationPaymentTypeMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<OrganizationPaymentTypeMutationResponse>(
    `${BASE_PATH}/${paymentTypeId}`,
    input
  );
}

export async function deleteOrganizationPaymentType(
  paymentTypeId: string | number
): Promise<OrganizationPaymentTypeMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<OrganizationPaymentTypeMutationResponse>(`${BASE_PATH}/${paymentTypeId}`);
}

/** Lightweight id/name list for accounting journal forms. */
export async function listPaymentTypes(): Promise<FineractPaymentTypeOption[]> {
  const paymentTypes = await listOrganizationPaymentTypes();
  return paymentTypes.map((paymentType) => ({
    id: paymentType.id,
    name: paymentType.name
  }));
}

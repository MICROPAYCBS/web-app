import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationFund, OrganizationFundMutationResponse } from '@mifos/api-client';
import type { CreateFundPayload, UpdateFundPayload } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/funds';

export function normalizeOrganizationFund(raw: unknown): OrganizationFund | null {
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
    externalId: typeof row.externalId === 'string' ? row.externalId : undefined
  };
}

function normalizeList(value: unknown): OrganizationFund[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeOrganizationFund(item))
    .filter((item): item is OrganizationFund => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function listOrganizationFunds(): Promise<OrganizationFund[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  return normalizeList(raw);
}

export async function getOrganizationFund(fundId: string | number): Promise<OrganizationFund> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${fundId}`);
  const fund = normalizeOrganizationFund(raw);
  if (!fund) {
    throw new Error('Fund not found.');
  }
  return fund;
}

export async function createOrganizationFund(
  input: CreateFundPayload
): Promise<OrganizationFundMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<OrganizationFundMutationResponse>(BASE_PATH, input);
}

export async function updateOrganizationFund(
  fundId: string | number,
  input: UpdateFundPayload
): Promise<OrganizationFundMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<OrganizationFundMutationResponse>(`${BASE_PATH}/${fundId}`, input);
}

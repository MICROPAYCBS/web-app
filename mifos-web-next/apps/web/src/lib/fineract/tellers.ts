import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  OrganizationTeller,
  OrganizationTellerListItem,
  OrganizationTellerMutationResponse
} from '@mifos/api-client';
import type { CreateTellerPayload, UpdateTellerPayload } from '@mifos/validation';
import { buildTellerPayload } from '@/lib/fineract/build-teller-payload';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/tellers';

function normalizeTellerListItem(raw: unknown): OrganizationTellerListItem | null {
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
    officeId: row.officeId != null ? Number(row.officeId) : undefined,
    officeName: typeof row.officeName === 'string' ? row.officeName : undefined,
    name,
    startDate: row.startDate as number[] | string | undefined,
    status: typeof row.status === 'string' ? row.status : undefined
  };
}

function normalizeTeller(raw: unknown): OrganizationTeller | null {
  const listItem = normalizeTellerListItem(raw);
  if (!listItem) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const officeId = Number(row.officeId);
  if (!Number.isFinite(officeId)) {
    return null;
  }
  return {
    ...listItem,
    officeId,
    description: typeof row.description === 'string' ? row.description : undefined,
    endDate: row.endDate as number[] | string | undefined
  };
}

export async function listOrganizationTellers(): Promise<OrganizationTellerListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(BASE_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeTellerListItem(item))
    .filter((item): item is OrganizationTellerListItem => item !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getOrganizationTeller(tellerId: string | number): Promise<OrganizationTeller> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${BASE_PATH}/${tellerId}`);
  const teller = normalizeTeller(raw);
  if (!teller) {
    throw new Error('Teller not found.');
  }
  return teller;
}

export async function createOrganizationTeller(
  input: CreateTellerPayload
): Promise<OrganizationTellerMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<OrganizationTellerMutationResponse>(BASE_PATH, buildTellerPayload(input));
}

export async function updateOrganizationTeller(
  tellerId: string | number,
  input: UpdateTellerPayload
): Promise<OrganizationTellerMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.put<OrganizationTellerMutationResponse>(
    `${BASE_PATH}/${tellerId}`,
    buildTellerPayload(input)
  );
}

export async function deleteOrganizationTeller(
  tellerId: string | number
): Promise<OrganizationTellerMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<OrganizationTellerMutationResponse>(`${BASE_PATH}/${tellerId}`);
}

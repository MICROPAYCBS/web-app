/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  FineractCreateOfficeResponse,
  FineractOfficeDetail,
  FineractOfficeEditTemplate,
  FineractOfficeListItem
} from '@mifos/api-client';
import type { FineractOfficeOption } from '@mifos/api-client';
import type { CreateOfficePayload, UpdateOfficePayload } from '@mifos/validation';
import { buildOfficePayload } from '@/lib/fineract/build-office-payload';
import { createFineractClient } from '@/lib/fineract/create-client';

function normalizeOfficeList(
  data: FineractOfficeListItem[] | { pageItems?: FineractOfficeListItem[] } | null | undefined
): FineractOfficeListItem[] {
  const list = Array.isArray(data) ? data : (data?.pageItems ?? []);
  return list.filter((office) => typeof office.id === 'number' && office.name?.trim());
}

export async function listOffices(): Promise<FineractOfficeListItem[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<
    FineractOfficeListItem[] | { pageItems?: FineractOfficeListItem[] }
  >('/offices');
  return normalizeOfficeList(data);
}

export async function listOfficeOptions(): Promise<FineractOfficeOption[]> {
  const offices = await listOffices();
  return offices
    .filter((office) => office.name?.trim() || office.nameDecorated?.trim())
    .map((office) => ({
      id: office.id,
      name: office.name,
      nameDecorated: office.nameDecorated
    }));
}

export async function getOffice(officeId: string | number): Promise<FineractOfficeDetail> {
  const fineract = await createFineractClient();
  return fineract.get<FineractOfficeDetail>(`/offices/${officeId}`);
}

export async function getOfficeEditTemplate(
  officeId: string | number
): Promise<FineractOfficeEditTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<FineractOfficeEditTemplate>(`/offices/${officeId}`, { template: 'true' });
}

export async function createOffice(
  input: CreateOfficePayload
): Promise<FineractCreateOfficeResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCreateOfficeResponse>('/offices', buildOfficePayload(input));
}

export async function updateOffice(
  officeId: string | number,
  input: UpdateOfficePayload
): Promise<FineractCreateOfficeResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCreateOfficeResponse>(
    `/offices/${officeId}`,
    buildOfficePayload(input)
  );
}

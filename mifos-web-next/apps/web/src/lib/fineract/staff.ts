/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type {
  FineractStaff,
  FineractStaffEditTemplate,
  FineractStaffListItem
} from '@mifos/api-client';
import type { CreateStaffPayload, UpdateStaffPayload } from '@mifos/validation';
import { buildStaffPayload } from '@/lib/fineract/build-staff-payload';
import { createFineractClient } from '@/lib/fineract/create-client';

export interface FineractCreateStaffResponse {
  resourceId?: number;
}

export async function listStaff(): Promise<FineractStaffListItem[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<FineractStaffListItem[]>('/staff');
  return rows ?? [];
}

export async function getStaff(staffId: string | number): Promise<FineractStaff> {
  const fineract = await createFineractClient();
  return fineract.get<FineractStaff>(`/staff/${staffId}`);
}

export async function getStaffEditTemplate(
  staffId: string | number
): Promise<FineractStaffEditTemplate> {
  const fineract = await createFineractClient();
  return fineract.get<FineractStaffEditTemplate>(`/staff/${staffId}`, { template: 'true' });
}

export async function createStaff(
  input: CreateStaffPayload
): Promise<FineractCreateStaffResponse> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCreateStaffResponse>('/staff', buildStaffPayload(input));
}

export async function updateStaff(
  staffId: string | number,
  input: UpdateStaffPayload
): Promise<FineractCreateStaffResponse> {
  const fineract = await createFineractClient();
  return fineract.put<FineractCreateStaffResponse>(
    `/staff/${staffId}`,
    buildStaffPayload(input)
  );
}

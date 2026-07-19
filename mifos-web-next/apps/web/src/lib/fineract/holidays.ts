import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  HolidayDetail,
  HolidayListItem,
  HolidayMutationResponse,
  HolidayReschedulingTypeOption
} from '@mifos/api-client';
import type {
  CreateHolidayPayload,
  UpdateActiveHolidayPayload,
  UpdatePendingHolidayPayload
} from '@mifos/validation';
import {
  buildCreateHolidayPayload,
  buildUpdateActiveHolidayPayload,
  buildUpdatePendingHolidayPayload
} from '@/lib/fineract/build-holiday-payload';
import { isHolidayDeleted } from '@/lib/fineract/holiday-display';
import { createFineractClient } from '@/lib/fineract/create-client';

const BASE_PATH = '/holidays';

export async function listHolidaysByOffice(officeId: string | number): Promise<HolidayListItem[]> {
  const fineract = await createFineractClient();
  const rows = await fineract.get<HolidayListItem[]>(BASE_PATH, {
    officeId: String(officeId)
  });
  return (rows ?? []).filter((row) => !isHolidayDeleted(row.status));
}

export async function getHolidayReschedulingTypes(): Promise<HolidayReschedulingTypeOption[]> {
  const fineract = await createFineractClient();
  const template = await fineract.get<HolidayReschedulingTypeOption[]>(`${BASE_PATH}/template`);
  return template ?? [];
}

export async function getHoliday(holidayId: string | number): Promise<HolidayDetail> {
  const fineract = await createFineractClient();
  return fineract.get<HolidayDetail>(`${BASE_PATH}/${holidayId}`);
}

export async function createHoliday(
  input: CreateHolidayPayload
): Promise<HolidayMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<HolidayMutationResponse>(BASE_PATH, buildCreateHolidayPayload(input));
}

export async function updateHoliday(
  holidayId: string | number,
  input: UpdateActiveHolidayPayload | UpdatePendingHolidayPayload,
  isActive: boolean
): Promise<HolidayMutationResponse> {
  const fineract = await createFineractClient();
  const body = isActive
    ? buildUpdateActiveHolidayPayload(input as UpdateActiveHolidayPayload)
    : buildUpdatePendingHolidayPayload(input as UpdatePendingHolidayPayload);
  return fineract.put<HolidayMutationResponse>(`${BASE_PATH}/${holidayId}`, body);
}

export async function deleteHoliday(
  holidayId: string | number
): Promise<HolidayMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.delete<HolidayMutationResponse>(`${BASE_PATH}/${holidayId}`);
}

export async function activateHoliday(
  holidayId: string | number
): Promise<HolidayMutationResponse> {
  const fineract = await createFineractClient();
  return fineract.post<HolidayMutationResponse>(`${BASE_PATH}/${holidayId}`, null, {
    command: 'activate'
  });
}

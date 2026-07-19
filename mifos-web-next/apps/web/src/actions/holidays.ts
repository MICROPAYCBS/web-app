'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { HolidayListItem } from '@mifos/api-client';
import {
  toFineractActionError,
  validateCreateHoliday,
  validateUpdateActiveHoliday,
  validateUpdatePendingHoliday,
  type CreateHolidayInput,
  type UpdateActiveHolidayInput,
  type UpdatePendingHolidayInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  HOLIDAY_LIST_PATH,
  holidayDetailPath,
  holidayEditPath
} from '@/lib/fineract/holiday-paths';
import {
  activateHoliday,
  createHoliday,
  deleteHoliday,
  listHolidaysByOffice,
  updateHoliday
} from '@/lib/fineract/holidays';
import { getServerSession } from '@/lib/session/server';

export type HolidayActionResult =
  | { ok: true; holidayId?: number; data?: HolidayListItem[] }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateHolidayViews(holidayId: string | number) {
  revalidatePath(HOLIDAY_LIST_PATH);
  revalidatePath(holidayDetailPath(holidayId));
  revalidatePath(holidayEditPath(holidayId));
}

export async function searchHolidaysByOfficeAction(
  officeId: string | number
): Promise<HolidayActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.holidays'));
  } catch {
    return { ok: false, message: 'You do not have permission to view holidays.' };
  }

  if (!officeId) {
    return { ok: false, message: 'Select a branch.' };
  }

  try {
    const data = await listHolidaysByOffice(officeId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Could not load holidays.');
  }
}

export async function createHolidayAction(
  input: CreateHolidayInput
): Promise<HolidayActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.holidays.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create holidays.' };
  }

  const parsed = validateCreateHoliday(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createHoliday(parsed.data);
    revalidatePath(HOLIDAY_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { holidayId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create holiday.');
  }
}

export async function updateHolidayAction(
  holidayId: string | number,
  input: UpdateActiveHolidayInput | UpdatePendingHolidayInput,
  isActive: boolean
): Promise<HolidayActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.holidays.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update holidays.' };
  }

  const parsed = isActive
    ? validateUpdateActiveHoliday(input)
    : validateUpdatePendingHoliday(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateHoliday(holidayId, parsed.data, isActive);
    revalidateHolidayViews(holidayId);
    return actionSuccessFromFineractCommand(response, { holidayId: response.resourceId ?? Number(holidayId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update holiday.');
  }
}

export async function deleteHolidayAction(
  holidayId: string | number
): Promise<HolidayActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.holidays.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete holidays.' };
  }

  try {
    const response = await deleteHoliday(holidayId);
    revalidatePath(HOLIDAY_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { holidayId: Number(holidayId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete holiday.');
  }
}

export async function activateHolidayAction(
  holidayId: string | number
): Promise<HolidayActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.holidays.activate'));
  } catch {
    return { ok: false, message: 'You do not have permission to activate holidays.' };
  }

  try {
    const response = await activateHoliday(holidayId);
    revalidateHolidayViews(holidayId);
    revalidatePath(HOLIDAY_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { holidayId: Number(holidayId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to activate holiday.');
  }
}

'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CenterGroupOption, CenterStaffOption } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import {
  toFineractActionError,
  validateCreateCenter,
  validateUpdateCenter,
  type CreateCenterInput,
  type UpdateCenterInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  centerCreatePath,
  centerDetailPath,
  centerGeneralPath,
  CENTERS_LIST_PATH
} from '@/lib/fineract/center-paths';
import {
  createCenter,
  defaultCenterMutationMeta,
  getCenterCreateTemplate,
  listGroupsByOffice,
  updateCenter
} from '@/lib/fineract/centers';
import { getServerSession } from '@/lib/session/server';

export type CenterActionResult =
  | { ok: true; centerId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type CenterDataResult<T> = { ok: true; data: T } | { ok: false; message: string };

function fieldErrorsFromZod(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function assertCentersListAccess(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('clients.list'));
}

export async function loadCenterStaffAction(
  officeId: string | number
): Promise<CenterDataResult<CenterStaffOption[]>> {
  const session = await getServerSession();
  try {
    assertCentersListAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to access centers.' };
  }

  try {
    const template = await getCenterCreateTemplate(officeId);
    return { ok: true, data: template.staffOptions };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load staff for the selected branch.');
  }
}

export async function loadCenterGroupsAction(
  officeId: string | number
): Promise<CenterDataResult<CenterGroupOption[]>> {
  const session = await getServerSession();
  try {
    assertCentersListAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to access centers.' };
  }

  try {
    const data = await listGroupsByOffice(officeId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load groups for the selected branch.');
  }
}

export async function createCenterAction(
  input: Omit<CreateCenterInput, 'dateFormat' | 'locale'>
): Promise<CenterActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_CENTER');
  } catch {
    return { ok: false, message: 'You do not have permission to create centers.' };
  }

  const parsed = validateCreateCenter({
    ...defaultCenterMutationMeta(),
    ...input
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid center data.',
      fieldErrors: fieldErrorsFromZod(parsed.error)
    };
  }

  try {
    const response = await createCenter(parsed.data);
    const centerId = response.resourceId;
    revalidatePath(CENTERS_LIST_PATH);
    if (centerId != null) {
      revalidatePath(centerDetailPath(centerId));
    }
    return { ok: true, centerId: centerId ?? undefined };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create center.');
  }
}

export async function updateCenterAction(
  centerId: string | number,
  input: Omit<UpdateCenterInput, 'dateFormat' | 'locale'>
): Promise<CenterActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CENTER');
  } catch {
    return { ok: false, message: 'You do not have permission to update centers.' };
  }

  const parsed = validateUpdateCenter({
    ...defaultCenterMutationMeta(),
    ...input
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid center data.',
      fieldErrors: fieldErrorsFromZod(parsed.error)
    };
  }

  try {
    await updateCenter(centerId, parsed.data);
    revalidatePath(CENTERS_LIST_PATH);
    revalidatePath(centerDetailPath(centerId));
    revalidatePath(centerGeneralPath(centerId));
    return { ok: true, centerId: Number(centerId) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update center.');
  }
}

'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { toFineractActionError } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { INDUSTRY_LIST_PATH, industryEditPath } from '@/lib/fineract/industry-paths';
import {
  createIndustry,
  deleteIndustry,
  updateIndustry,
  type UpsertIndustryInput
} from '@/lib/fineract/industries';
import { getServerSession } from '@/lib/session/server';

export type IndustryActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function validateInput(input: UpsertIndustryInput): Record<string, string> | null {
  const fieldErrors: Record<string, string> = {};
  if (!input.industryCode?.trim()) {
    fieldErrors.industryCode = 'Industry code is required.';
  }
  if (!input.industryName?.trim()) {
    fieldErrors.industryName = 'Industry name is required.';
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

function revalidateIndustryViews(industryId?: number) {
  revalidatePath(INDUSTRY_LIST_PATH);
  if (industryId != null) {
    revalidatePath(industryEditPath(industryId));
  }
}

export async function createIndustryAction(input: UpsertIndustryInput): Promise<IndustryActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_INDUSTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to create industries.' };
  }

  const fieldErrors = validateInput(input);
  if (fieldErrors) {
    return { ok: false, message: 'Fix the highlighted fields.', fieldErrors };
  }

  try {
    const response = await createIndustry(input);
    revalidateIndustryViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create industry.');
  }
}

export async function updateIndustryAction(
  industryId: number,
  input: UpsertIndustryInput
): Promise<IndustryActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_INDUSTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to update industries.' };
  }

  const fieldErrors = validateInput(input);
  if (fieldErrors) {
    return { ok: false, message: 'Fix the highlighted fields.', fieldErrors };
  }

  try {
    const response = await updateIndustry(industryId, input);
    revalidateIndustryViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update industry.');
  }
}

export async function deleteIndustryAction(industryId: number): Promise<IndustryActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_INDUSTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to delete industries.' };
  }

  try {
    await deleteIndustry(industryId);
    revalidateIndustryViews();
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete industry.');
  }
}

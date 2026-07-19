'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import {
  toFineractActionError,
  validateUpsertProvisioningCriteria,
  type UpsertProvisioningCriteriaInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createProvisioningCriteria,
  deleteProvisioningCriteria,
  updateProvisioningCriteria
} from '@/lib/fineract/provisioning-criteria';
import {
  PROVISIONING_CRITERIA_LIST_PATH,
  provisioningCriteriaDetailPath,
  provisioningCriteriaEditPath
} from '@/lib/fineract/provisioning-criteria-paths';
import { getServerSession } from '@/lib/session/server';

export type ProvisioningCriteriaActionResult =
  | { ok: true; criteriaId?: number }
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

function revalidateProvisioningCriteriaViews(criteriaId: string | number) {
  revalidatePath(PROVISIONING_CRITERIA_LIST_PATH);
  revalidatePath(provisioningCriteriaDetailPath(criteriaId));
  revalidatePath(provisioningCriteriaEditPath(criteriaId));
}

export async function createProvisioningCriteriaAction(
  input: UpsertProvisioningCriteriaInput
): Promise<ProvisioningCriteriaActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_PROVISIONING_CRITERIA');
  } catch {
    return { ok: false, message: 'You do not have permission to create provisioning criteria.' };
  }

  const parsed = validateUpsertProvisioningCriteria(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createProvisioningCriteria(parsed.data);
    revalidatePath(PROVISIONING_CRITERIA_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { criteriaId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create provisioning criteria.');
  }
}

export async function updateProvisioningCriteriaAction(
  criteriaId: string | number,
  input: UpsertProvisioningCriteriaInput
): Promise<ProvisioningCriteriaActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_CRITERIA');
  } catch {
    return { ok: false, message: 'You do not have permission to update provisioning criteria.' };
  }

  const parsed = validateUpsertProvisioningCriteria(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateProvisioningCriteria(criteriaId, parsed.data);
    revalidateProvisioningCriteriaViews(criteriaId);
    return actionSuccessFromFineractCommand(response, { criteriaId: response.resourceId ?? Number(criteriaId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update provisioning criteria.');
  }
}

export async function deleteProvisioningCriteriaAction(
  criteriaId: string | number
): Promise<ProvisioningCriteriaActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_CRITERIA');
  } catch {
    return { ok: false, message: 'You do not have permission to delete provisioning criteria.' };
  }

  try {
    const response = await deleteProvisioningCriteria(criteriaId);
    revalidatePath(PROVISIONING_CRITERIA_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { criteriaId: Number(criteriaId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete provisioning criteria.');
  }
}

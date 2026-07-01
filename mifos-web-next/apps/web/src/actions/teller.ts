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
  validateCreateTeller,
  validateUpdateTeller,
  type CreateTellerInput,
  type UpdateTellerInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  TELLER_LIST_PATH,
  tellerCashiersPath,
  tellerDetailPath,
  tellerLegacyEditPath
} from '@/lib/fineract/teller-paths';
import {
  createOrganizationTeller,
  deleteOrganizationTeller,
  updateOrganizationTeller
} from '@/lib/fineract/tellers';
import { getServerSession } from '@/lib/session/server';

export type TellerActionResult =
  | { ok: true; tellerId?: number }
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

function revalidateTellerViews(tellerId: string | number) {
  revalidatePath(TELLER_LIST_PATH);
  revalidatePath(tellerDetailPath(tellerId));
  revalidatePath(tellerLegacyEditPath(tellerId));
  revalidatePath(tellerCashiersPath(tellerId));
}

export async function createTellerAction(input: CreateTellerInput): Promise<TellerActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to create tellers.' };
  }

  const parsed = validateCreateTeller(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createOrganizationTeller(parsed.data);
    revalidatePath(TELLER_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { tellerId: response.resourceId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create teller.');
  }
}

export async function updateTellerAction(
  tellerId: string | number,
  input: UpdateTellerInput
): Promise<TellerActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to update tellers.' };
  }

  const parsed = validateUpdateTeller(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateOrganizationTeller(tellerId, parsed.data);
    revalidateTellerViews(tellerId);
    return actionSuccessFromFineractCommand(response, { tellerId: response.resourceId ?? Number(tellerId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to update teller.');
  }
}

export async function deleteTellerAction(tellerId: string | number): Promise<TellerActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_TELLER');
  } catch {
    return { ok: false, message: 'You do not have permission to delete tellers.' };
  }

  try {
    const response = await deleteOrganizationTeller(tellerId);
    revalidatePath(TELLER_LIST_PATH);
    return actionSuccessFromFineractCommand(response, { tellerId: Number(tellerId) });
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete teller.');
  }
}

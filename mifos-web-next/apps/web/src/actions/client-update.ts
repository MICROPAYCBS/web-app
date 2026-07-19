'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  updateClientDiffBaselineSchema,
  updateClientSchema,
  toFineractActionError,
  type FineractCommandActionMeta
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { EmptyUpdatePayloadError } from '@/lib/fineract/partial-update-payload';
import { getClientForEdit } from '@/lib/fineract/client-edit';
import { mapClientToEditFormInput } from '@/lib/fineract/client-edit-map';
import { updateClient } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export type UpdateClientActionResult =
  | ({ ok: true } & FineractCommandActionMeta)
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function updateClientAction(
  clientId: string,
  raw: unknown,
  clientInitialSnapshot?: unknown
): Promise<UpdateClientActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update customers.' };
  }

  const parsed = updateClientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (key && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }

  const clientInitialParsed = clientInitialSnapshot
    ? updateClientDiffBaselineSchema.safeParse(clientInitialSnapshot)
    : null;

  let initial;
  if (clientInitialParsed?.success) {
    initial = clientInitialParsed.data;
  } else {
    try {
      const editData = await getClientForEdit(clientId);
      const initialMapped = mapClientToEditFormInput(editData);
      const initialParsed = updateClientDiffBaselineSchema.safeParse(initialMapped);
      if (!initialParsed.success) {
        return { ok: false, message: 'Could not load customer baseline for update.' };
      }
      initial = initialParsed.data;
    } catch {
      return { ok: false, message: 'Could not load customer details for update.' };
    }
  }

  if (initial.staffId && !parsed.data.staffId) {
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors: {
        staffId:
          'A relationship officer is required. Use Reassign relationship officer to change officers.'
      }
    };
  }

  try {
    const response = await updateClient(clientId, parsed.data, { initial });
    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}/general`);
    revalidatePath(`/clients/${clientId}/edit`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    if (err instanceof EmptyUpdatePayloadError) {
      return { ok: false, message: err.message };
    }
    return toFineractActionError(err, 'Could not update customer.');
  }
}

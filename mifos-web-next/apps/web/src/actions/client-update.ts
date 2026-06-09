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
  updateClientSchema,
  toFineractActionError,
  type UpdateClientInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updateClient } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export type UpdateClientActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function updateClientAction(
  clientId: string,
  raw: unknown,
  initialSnapshot?: UpdateClientInput
): Promise<UpdateClientActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update clients.' };
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

  const initialParsed = initialSnapshot
    ? updateClientSchema.safeParse(initialSnapshot)
    : null;
  const initial =
    initialParsed?.success === true ? initialParsed.data : undefined;

  try {
    await updateClient(clientId, parsed.data, { initial });
    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}/general`);
    revalidatePath(`/clients/${clientId}/edit`);
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Could not update client.');
  }
}

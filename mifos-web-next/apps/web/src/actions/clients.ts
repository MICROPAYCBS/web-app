'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { createClientSchema, toFineractActionError, type CreateClientPayload } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/fineract/clients';
import { getServerSession } from '@/lib/session/server';

export type ClientActionResult =
  | { ok: true; clientId: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function createClientAction(
  raw: unknown
): Promise<ClientActionResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create customers.' };
  }

  const parsed = createClientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: 'Please fix the highlighted fields.', fieldErrors };
  }

  try {
    const result = await createClient(parsed.data as CreateClientPayload);
    const clientId = result.clientId ?? result.resourceId;
    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    return { ok: true, clientId };
  } catch (err) {
    return toFineractActionError(err, 'Failed to create customer.');
  }
}

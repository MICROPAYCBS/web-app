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
  actionSuccessFromFineractCommand,
  type FineractCommandActionMeta
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { deleteClientById } from '@/lib/fineract/client-commands';
import { getServerSession } from '@/lib/session/server';

export type ClientCommandActionResult =
  | ({ ok: true } & FineractCommandActionMeta)
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requirePermission(
  permission: string,
  deniedMessage: string
): Promise<ClientCommandActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, permission);
  } catch {
    return { ok: false, message: deniedMessage };
  }
  return null;
}

export async function deleteClientAction(
  clientId: string
): Promise<ClientCommandActionResult> {
  const denied = await requirePermission(
    'DELETE_CLIENT',
    'You do not have permission to delete customers.'
  );
  if (denied) {
    return denied;
  }

  try {
    const response = await deleteClientById(clientId);
    revalidatePath('/clients');
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Could not delete customer.');
  }
}

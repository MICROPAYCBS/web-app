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
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { deleteClientDocument } from '@/lib/fineract/client-documents';
import { getServerSession } from '@/lib/session/server';

export type ClientDocumentActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function requireDeletePermission(): Promise<ClientDocumentActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'DELETE_DOCUMENT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete documents.' };
  }
  return null;
}

export async function deleteClientDocumentAction(
  clientId: string,
  documentId: number
): Promise<ClientDocumentActionResult> {
  const denied = await requireDeletePermission();
  if (denied) {
    return denied;
  }

  try {
    const response = await deleteClientDocument(clientId, documentId);
    revalidatePath(`/clients/${clientId}/documents`);
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

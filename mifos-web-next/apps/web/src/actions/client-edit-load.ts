'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { FineractClientEditData } from '@mifos/api-client';
import { getClientForEdit } from '@/lib/fineract/client-edit';
import { getServerSession } from '@/lib/session/server';

export type LoadClientForEditResult =
  | { ok: true; data: FineractClientEditData }
  | { ok: false; message: string };

export async function loadClientForEditAction(
  clientId: string
): Promise<LoadClientForEditResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }

  try {
    assertCan(session, resolvePermission('clients.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update customers.' };
  }

  try {
    const data = await getClientForEdit(clientId);
    return { ok: true, data };
  } catch {
    return { ok: false, message: 'Could not load customer details for editing.' };
  }
}

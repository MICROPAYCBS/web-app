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
import { releaseSavingsOnHoldAmount } from '@/lib/fineract/client-transfer';
import { getServerSession } from '@/lib/session/server';

export type ReleaseOnHoldResult = { ok: true } | { ok: false; message: string };

export async function releaseSavingsOnHoldAction(
  clientId: string,
  savingsId: string,
  transactionId: string
): Promise<ReleaseOnHoldResult> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, 'UPDATE_SAVINGSACCOUNT');
  } catch {
    return {
      ok: false,
      message: 'You do not have permission to update savings accounts.'
    };
  }

  try {
    await releaseSavingsOnHoldAmount(savingsId, transactionId);
    revalidatePath(`/clients/${clientId}`, 'layout');
    return { ok: true };
  } catch (err) {
    return toFineractActionError(
      err,
      'Could not release the held amount. The transfer may still be blocked until all holds are cleared.'
    );
  }
}

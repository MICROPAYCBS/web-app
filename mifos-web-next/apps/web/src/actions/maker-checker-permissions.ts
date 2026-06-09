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
  validateUpdateMakerCheckerPermissions,
  type UpdateMakerCheckerPermissionsInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { updateMakerCheckerPermissions } from '@/lib/fineract/maker-checker-permissions';
import { getServerSession } from '@/lib/session/server';

const PAGE_PATH = '/system/configure-mc-tasks';

export type MakerCheckerPermissionsActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateMakerCheckerPermissionsAction(
  input: UpdateMakerCheckerPermissionsInput
): Promise<MakerCheckerPermissionsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_PERMISSION');
  } catch {
    return { ok: false, message: 'You do not have permission to update maker-checker tasks.' };
  }

  const parsed = validateUpdateMakerCheckerPermissions(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Invalid maker-checker configuration.'
    };
  }

  try {
    await updateMakerCheckerPermissions(parsed.data);
    revalidatePath(PAGE_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update maker-checker tasks.');
  }
}

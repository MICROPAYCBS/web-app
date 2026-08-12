'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { actionSuccessFromFineractCommand, toFineractActionError } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { revokeUserSession } from '@/lib/fineract/user-sessions';
import { getServerSession } from '@/lib/session/server';

export type RevokeUserSessionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function revokeUserSessionAction(
  userId: number,
  sessionId: number
): Promise<RevokeUserSessionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('administration.users.sessions.revoke'));
  } catch {
    return { ok: false, message: 'You do not have permission to revoke sessions.' };
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, message: 'Invalid user id.' };
  }
  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { ok: false, message: 'Invalid session id.' };
  }

  try {
    const response = await revokeUserSession(userId, sessionId);
    revalidatePath(`/appusers/${userId}`);
    revalidatePath('/account/sessions');
    revalidatePath('/appusers/login-history');
    return actionSuccessFromFineractCommand(response, { resourceId: sessionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to revoke session.');
  }
}

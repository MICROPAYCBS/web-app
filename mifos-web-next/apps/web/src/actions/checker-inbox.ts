'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxActionCommand } from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import {
  toFineractActionError,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { deleteCheckerInboxItem, executeCheckerInboxAction } from '@/lib/fineract/checker-inbox';
import {
  CHECKER_INBOX_LIST_PATH,
  checkerInboxDetailPath
} from '@/lib/fineract/checker-inbox-paths';
import { getServerSession } from '@/lib/session/server';

export type CheckerInboxActionResult = { ok: true } | { ok: false; message: string };

function assertCheckerInboxAccess(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('checkerInbox'));
}

export async function executeCheckerInboxActionAction(
  checkerId: number,
  command: CheckerInboxActionCommand
): Promise<CheckerInboxActionResult> {
  const session = await getServerSession();
  try {
    assertCheckerInboxAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to manage checker inbox items.' };
  }

  if (!Number.isFinite(checkerId)) {
    return { ok: false, message: 'Invalid checker inbox item.' };
  }

  try {
    const response = await executeCheckerInboxAction(checkerId, command);
    revalidatePath(CHECKER_INBOX_LIST_PATH);
    revalidatePath(checkerInboxDetailPath(checkerId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    const fallback =
      command === 'approve' ? 'Failed to approve checker item.' : 'Failed to reject checker item.';
    return toFineractActionError(error, fallback);
  }
}

export async function deleteCheckerInboxItemAction(
  checkerId: number
): Promise<CheckerInboxActionResult> {
  const session = await getServerSession();
  try {
    assertCheckerInboxAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to manage checker inbox items.' };
  }

  if (!Number.isFinite(checkerId)) {
    return { ok: false, message: 'Invalid checker inbox item.' };
  }

  try {
    const response = await deleteCheckerInboxItem(checkerId);
    revalidatePath(CHECKER_INBOX_LIST_PATH);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete checker item.');
  }
}

export async function bulkExecuteCheckerInboxActionAction(
  checkerIds: number[],
  command: CheckerInboxActionCommand
): Promise<CheckerInboxActionResult> {
  const session = await getServerSession();
  try {
    assertCheckerInboxAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to manage checker inbox items.' };
  }

  const ids = checkerIds.filter((id) => Number.isFinite(id));
  if (!ids.length) {
    return { ok: false, message: 'Select at least one checker inbox item.' };
  }

  try {
    for (const id of ids) {
      const response = await executeCheckerInboxAction(id, command);
    }
    revalidatePath(CHECKER_INBOX_LIST_PATH);
    return { ok: true };
  } catch (error) {
    const fallback =
      command === 'approve'
        ? 'Failed to approve selected checker items.'
        : 'Failed to reject selected checker items.';
    return toFineractActionError(error, fallback);
  }
}

export async function bulkDeleteCheckerInboxItemsAction(
  checkerIds: number[]
): Promise<CheckerInboxActionResult> {
  const session = await getServerSession();
  try {
    assertCheckerInboxAccess(session);
  } catch {
    return { ok: false, message: 'You do not have permission to manage checker inbox items.' };
  }

  const ids = checkerIds.filter((id) => Number.isFinite(id));
  if (!ids.length) {
    return { ok: false, message: 'Select at least one checker inbox item.' };
  }

  try {
    for (const id of ids) {
      const response = await deleteCheckerInboxItem(id);
    }
    revalidatePath(CHECKER_INBOX_LIST_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete selected checker items.');
  }
}

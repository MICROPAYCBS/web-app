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
  classifyMakerCheckerApproveOutcome,
  classifyMakerCheckerRejectOutcome,
  parseFineractCommandResult,
  toFineractActionError
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type {
  CheckerInboxActionSuccess,
  CheckerInboxMutationResult
} from '@/lib/checker-inbox/checker-inbox-action-result';
import {
  deleteCheckerInboxItem,
  executeCheckerInboxAction,
  getCheckerInboxDetail
} from '@/lib/fineract/checker-inbox';
import { isPendingCheckerAuditResult } from '@/lib/fineract/audit-trail-display';
import {
  CHECKER_INBOX_LIST_PATH,
  checkerInboxDetailPath
} from '@/lib/fineract/checker-inbox-paths';
import { getServerSession } from '@/lib/session/server';

export type CheckerInboxActionResult = CheckerInboxMutationResult;

function assertCheckerInboxAccess(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('checkerInbox'));
}

type MakerCheckerItemContext = {
  actionName?: string;
  entityName?: string;
};

function success(
  outcome: CheckerInboxActionSuccess['outcome'],
  commandId?: number
): CheckerInboxActionSuccess {
  return { ok: true, outcome, ...(commandId != null ? { commandId } : {}) };
}

async function classifyRejectResponse(
  checkerId: number,
  raw: unknown
): Promise<CheckerInboxActionSuccess> {
  const stillPending = await getCheckerInboxDetail(checkerId)
    .then((detail) => detail != null && isPendingCheckerAuditResult(detail.processingResult))
    .catch(() => false);

  return success(classifyMakerCheckerRejectOutcome(stillPending));
}

export async function executeCheckerInboxActionAction(
  checkerId: number,
  command: CheckerInboxActionCommand,
  itemContext?: MakerCheckerItemContext
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

    if (command === 'approve') {
      const outcome = classifyMakerCheckerApproveOutcome(response, itemContext);
      const parsed = parseFineractCommandResult(response);
      return success(outcome, parsed.commandId);
    }

    return classifyRejectResponse(checkerId, response);
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
    await deleteCheckerInboxItem(checkerId);
    revalidatePath(CHECKER_INBOX_LIST_PATH);
    return success('completed');
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete checker item.');
  }
}

export async function bulkExecuteCheckerInboxActionAction(
  checkerIds: number[],
  command: CheckerInboxActionCommand,
  itemsById?: Record<number, MakerCheckerItemContext>
): Promise<CheckerInboxActionResult & { partialFailures?: string[] }> {
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

  const partialFailures: string[] = [];
  let lastSuccess: CheckerInboxActionSuccess = success('completed');

  try {
    for (const id of ids) {
      try {
        const response = await executeCheckerInboxAction(id, command);
        revalidatePath(checkerInboxDetailPath(id));

        if (command === 'approve') {
          const outcome = classifyMakerCheckerApproveOutcome(response, itemsById?.[id]);
          const parsed = parseFineractCommandResult(response);
          lastSuccess = success(outcome, parsed.commandId);
        } else {
          lastSuccess = await classifyRejectResponse(id, response);
        }
      } catch (error) {
        const mapped = toFineractActionError(
          error,
          command === 'approve' ? 'Failed to approve checker item.' : 'Failed to reject checker item.'
        );
        partialFailures.push(`#${id}: ${mapped.message}`);
      }
    }

    revalidatePath(CHECKER_INBOX_LIST_PATH);

    if (partialFailures.length === ids.length) {
      return { ok: false, message: partialFailures[0] ?? 'Bulk action failed.' };
    }

    if (partialFailures.length > 0) {
      return {
        ...lastSuccess,
        partialFailures
      };
    }

    return lastSuccess;
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
      await deleteCheckerInboxItem(id);
    }
    revalidatePath(CHECKER_INBOX_LIST_PATH);
    return success('completed');
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete selected checker items.');
  }
}

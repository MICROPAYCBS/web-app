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
  actionSuccessFromFineractCommand,
  shareAccountActivateCommandSchema,
  shareAccountAdditionalSharesDecisionSchema,
  shareAccountApplyAdditionalSharesSchema,
  shareAccountApproveCommandSchema,
  shareAccountCloseCommandSchema,
  shareAccountRedeemSharesSchema,
  shareAccountRejectCommandSchema,
  shareAccountUndoApprovalCommandSchema,
  toFineractActionError
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { buildFineractCommandBody, buildFineractNoteCommandBody } from '@/lib/fineract/client-command-body';
import { clientAccountGeneralPath, clientAccountListPath } from '@/lib/fineract/client-account-links';
import {
  executeShareAccountCommand,
  type ShareAccountCommand
} from '@/lib/fineract/share-account-commands';
import type { ShareAccountActionResult } from '@/lib/fineract/share-account-action-result';
import { getServerSession } from '@/lib/session/server';

const COMMAND_PERMISSIONS: Record<ShareAccountCommand, string> = {
  approve: 'APPROVE_SHAREACCOUNT',
  undoapproval: 'APPROVALUNDO_SHAREACCOUNT',
  activate: 'ACTIVATE_SHAREACCOUNT',
  reject: 'REJECT_SHAREACCOUNT',
  close: 'CLOSE_SHAREACCOUNT',
  applyadditionalshares: 'APPLYADDITIONAL_SHAREACCOUNT',
  approveadditionalshares: 'APPROVEADDITIONAL_SHAREACCOUNT',
  rejectadditionalshares: 'REJECTADDITIONAL_SHAREACCOUNT',
  redeemshares: 'REDEEMSHARES_SHAREACCOUNT'
};

function fieldErrorsFromZodError(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function parseOrError<T>(
  schema: z.ZodType<T>,
  raw: unknown
): { success: true; data: T } | { success: false; result: ShareAccountActionResult } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      result: {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: fieldErrorsFromZodError(parsed.error)
      }
    };
  }
  return { success: true, data: parsed.data };
}

function omitEmptyStrings(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== '' && value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function revalidateShareAccountPaths(clientId: string, accountId: string) {
  revalidatePath(clientAccountListPath(clientId, 'share'));
  revalidatePath(clientAccountGeneralPath(clientId, 'share', accountId));
  revalidatePath(`/clients/${clientId}`);
}

async function requirePermission(
  permission: string,
  message: string
): Promise<ShareAccountActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, permission);
    return null;
  } catch {
    return { ok: false, message };
  }
}

export async function executeShareAccountLifecycleCommandAction(
  clientId: string,
  accountId: string,
  command: 'approve' | 'undoapproval' | 'activate' | 'reject' | 'close',
  raw: unknown
): Promise<ShareAccountActionResult> {
  const denied = await requirePermission(
    COMMAND_PERMISSIONS[command],
    'You do not have permission for this action.'
  );
  if (denied) {
    return denied;
  }

  try {
    let body: Record<string, unknown>;
    switch (command) {
      case 'approve': {
        const parsed = parseOrError(shareAccountApproveCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        body = buildFineractCommandBody(
          omitEmptyStrings({
            approvedDate: parsed.data.approvedDate,
            note: parsed.data.note
          })
        );
        break;
      }
      case 'activate': {
        const parsed = parseOrError(shareAccountActivateCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        body = buildFineractCommandBody({ activatedDate: parsed.data.activatedDate });
        break;
      }
      case 'reject': {
        const parsed = parseOrError(shareAccountRejectCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        body = buildFineractCommandBody(
          omitEmptyStrings({
            rejectedDate: parsed.data.rejectedDate,
            note: parsed.data.note
          })
        );
        break;
      }
      case 'undoapproval': {
        const parsed = parseOrError(shareAccountUndoApprovalCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        body = buildFineractNoteCommandBody(parsed.data.note);
        break;
      }
      case 'close': {
        const parsed = parseOrError(shareAccountCloseCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        body = buildFineractCommandBody(
          omitEmptyStrings({
            closedDate: parsed.data.closedDate,
            note: parsed.data.note,
            ...(parsed.data.useSavings === true ? { useSavings: true } : {})
          })
        );
        break;
      }
      default: {
        const _exhaustive: never = command;
        return _exhaustive;
      }
    }

    const response = await executeShareAccountCommand(accountId, command, body);
    revalidateShareAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not complete share account action.');
  }
}

export async function executeShareAccountSharesCommandAction(
  clientId: string,
  accountId: string,
  command:
    | 'applyadditionalshares'
    | 'approveadditionalshares'
    | 'rejectadditionalshares'
    | 'redeemshares',
  raw: unknown
): Promise<ShareAccountActionResult> {
  const denied = await requirePermission(
    COMMAND_PERMISSIONS[command],
    'You do not have permission for this action.'
  );
  if (denied) {
    return denied;
  }

  try {
    let body: Record<string, unknown>;
    if (command === 'applyadditionalshares') {
      const parsed = parseOrError(shareAccountApplyAdditionalSharesSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody({
        requestedDate: parsed.data.requestedDate,
        requestedShares: parsed.data.requestedShares,
        ...(parsed.data.useSavings === true ? { useSavings: true } : {})
      });
    } else if (command === 'redeemshares') {
      const parsed = parseOrError(shareAccountRedeemSharesSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody({
        requestedDate: parsed.data.requestedDate,
        requestedShares: parsed.data.requestedShares,
        ...(parsed.data.useSavings === true ? { useSavings: true } : {})
      });
    } else {
      const parsed = parseOrError(shareAccountAdditionalSharesDecisionSchema, raw);
      if (!parsed.success) {
        return parsed.result;
      }
      body = buildFineractCommandBody({
        requestedShares: parsed.data.requestedShares
      });
    }

    const response = await executeShareAccountCommand(accountId, command, body);
    revalidateShareAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not complete share account action.');
  }
}

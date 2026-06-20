'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { z } from 'zod';
import {
  clientActivateCommandSchema,
  clientAssignStaffCommandSchema,
  clientCloseCommandSchema,
  clientReactivateCommandSchema,
  clientRejectCommandSchema,
  clientTransferCommandSchema,
  clientTransferNoteCommandSchema,
  clientUndoRejectionCommandSchema,
  clientUpdateSavingsCommandSchema,
  clientWithdrawCommandSchema,
  toFineractActionError
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import type { ClientActionSheetId } from '@/lib/clients/client-action-types';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import { executeClientCommand } from '@/lib/fineract/client-commands';
import { getServerSession } from '@/lib/session/server';
import type { ClientCommandActionResult } from '@/actions/client-command';

async function requireClientUpdate(): Promise<ClientCommandActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission('clients.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update customers.' };
  }
  return null;
}

function fieldErrorsFromZod(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

type ParsedResult<T> = { success: true; data: T } | { success: false; result: ClientCommandActionResult };

function parseOrError<T>(schema: z.ZodType<T>, raw: unknown): ParsedResult<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      result: {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors: fieldErrorsFromZod(parsed.error.issues)
      }
    };
  }
  return { success: true, data: parsed.data };
}

export async function executeClientActionCommand(
  clientId: string,
  sheetId: ClientActionSheetId,
  raw: unknown
): Promise<ClientCommandActionResult> {
  const denied = await requireClientUpdate();
  if (denied) {
    return denied;
  }

  try {
    switch (sheetId) {
      case 'activate': {
        const parsed = parseOrError(clientActivateCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(
          clientId,
          'activate',
          buildFineractCommandBody({ activationDate: parsed.data.activationDate })
        );
        break;
      }
      case 'close': {
        const parsed = parseOrError(clientCloseCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(
          clientId,
          'close',
          buildFineractCommandBody({
            closureDate: parsed.data.closureDate,
            closureReasonId: parsed.data.closureReasonId
          })
        );
        break;
      }
      case 'withdraw': {
        const parsed = parseOrError(clientWithdrawCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(
          clientId,
          'withdraw',
          buildFineractCommandBody({
            withdrawalDate: parsed.data.withdrawalDate,
            withdrawalReasonId: parsed.data.withdrawalReasonId
          })
        );
        break;
      }
      case 'reject': {
        const parsed = parseOrError(clientRejectCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(
          clientId,
          'reject',
          buildFineractCommandBody({
            rejectionDate: parsed.data.rejectionDate,
            rejectionReasonId: parsed.data.rejectionReasonId
          })
        );
        break;
      }
      case 'reactivate': {
        const parsed = parseOrError(clientReactivateCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(
          clientId,
          'reactivate',
          buildFineractCommandBody({ reactivationDate: parsed.data.reactivationDate })
        );
        break;
      }
      case 'undo-rejection': {
        const parsed = parseOrError(clientUndoRejectionCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(
          clientId,
          'undoRejection',
          buildFineractCommandBody({ reopenedDate: parsed.data.reopenedDate })
        );
        break;
      }
      case 'transfer': {
        const parsed = parseOrError(clientTransferCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        const { note, ...rest } = parsed.data;
        await executeClientCommand(
          clientId,
          'proposeTransfer',
          buildFineractCommandBody({
            destinationOfficeId: rest.destinationOfficeId,
            transferDate: rest.transferDate,
            ...(note ? { note } : {})
          })
        );
        break;
      }
      case 'accept-transfer':
      case 'reject-transfer':
      case 'undo-transfer': {
        const parsed = parseOrError(clientTransferNoteCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        // Fineract accept/reject/withdraw transfer accept optional note only — not transferDate.
        const body: Record<string, unknown> = {};
        if (parsed.data.note?.trim()) {
          body.note = parsed.data.note.trim();
        }
        const command =
          sheetId === 'accept-transfer'
            ? 'acceptTransfer'
            : sheetId === 'reject-transfer'
              ? 'rejectTransfer'
              : 'withdrawTransfer';
        await executeClientCommand(clientId, command, body);
        break;
      }
      case 'assign-staff': {
        const session = await getServerSession();
        try {
          assertCan(session, 'ASSIGNSTAFF_CLIENT');
        } catch {
          return { ok: false, message: 'You do not have permission to assign staff.' };
        }
        const parsed = parseOrError(clientAssignStaffCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(clientId, 'assignStaff', {
          staffId: parsed.data.staffId
        });
        break;
      }
      case 'update-default-savings': {
        const session = await getServerSession();
        try {
          assertCan(session, 'UPDATESAVINGSACCOUNT_CLIENT');
        } catch {
          return {
            ok: false,
            message: 'You do not have permission to update the default savings account.'
          };
        }
        const parsed = parseOrError(clientUpdateSavingsCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeClientCommand(clientId, 'updateSavingsAccount', {
          savingsAccountId: parsed.data.savingsAccountId
        });
        break;
      }
      default: {
        const _exhaustive: never = sheetId;
        return _exhaustive;
      }
    }

    revalidatePath(`/clients/${clientId}`, 'layout');
    return { ok: true };
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}


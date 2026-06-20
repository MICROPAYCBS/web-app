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
  savingsAccountActivateCommandSchema,
  savingsAccountApproveCommandSchema,
  savingsAccountBlockCommandSchema,
  savingsAccountCloseCommandSchema,
  savingsAccountRejectCommandSchema,
  savingsAccountTransactionCommandSchema,
  savingsAccountUndoApprovalCommandSchema,
  savingsAccountWithdrawnByApplicantCommandSchema,
  toFineractActionError
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import type { SavingsAccountActionResult } from '@/lib/fineract/savings-account-action-result';
import {
  executeSavingsAccountCommand,
  executeSavingsAccountTransaction,
  getSavingsAccountTransactionTemplate,
  SAVINGS_ACCOUNT_BLOCK_REASON_CODE_ID,
  type SavingsAccountLifecycleCommand,
  type SavingsAccountTransactionCommand
} from '@/lib/fineract/savings-account-commands';
import { listCodeValues } from '@/lib/fineract/system-codes';
import { getServerSession } from '@/lib/session/server';

const LIFECYCLE_PERMISSIONS: Record<SavingsAccountLifecycleCommand, string> = {
  approve: 'APPROVE_SAVINGSACCOUNT',
  activate: 'ACTIVATE_SAVINGSACCOUNT',
  reject: 'REJECT_SAVINGSACCOUNT',
  withdrawnByApplicant: 'WITHDRAW_SAVINGSACCOUNT',
  undoApproval: 'APPROVALUNDO_SAVINGSACCOUNT',
  close: 'CLOSE_SAVINGSACCOUNT',
  block: 'BLOCK_SAVINGSACCOUNT',
  unblock: 'UNBLOCK_SAVINGSACCOUNT',
  blockCredit: 'BLOCKCREDIT_SAVINGSACCOUNT',
  unblockCredit: 'UNBLOCKCREDIT_SAVINGSACCOUNT',
  blockDebit: 'BLOCKDEBIT_SAVINGSACCOUNT',
  unblockDebit: 'UNBLOCKDEBIT_SAVINGSACCOUNT'
};

const TRANSACTION_PERMISSIONS: Record<SavingsAccountTransactionCommand, string> = {
  deposit: 'DEPOSIT_SAVINGSACCOUNT',
  withdrawal: 'WITHDRAWAL_SAVINGSACCOUNT'
};

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

type ParsedResult<T> = { success: true; data: T } | { success: false; result: SavingsAccountActionResult };

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

type PermissionDenied = Extract<SavingsAccountActionResult, { ok: false }>;

async function requirePermission(
  permission: string,
  deniedMessage: string
): Promise<PermissionDenied | null> {
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

function revalidateSavingsAccountPaths(clientId: string, accountId: string | number) {
  revalidatePath(`/clients/${clientId}/savings-accounts/${accountId}/general`);
  revalidatePath(`/clients/${clientId}/savings`);
}

function omitEmptyStrings(fields: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && !value.trim()) {
      continue;
    }
    if (value !== undefined) {
      body[key] = value;
    }
  }
  return body;
}

export async function loadSavingsAccountTransactionSheetDataAction(
  accountId: string,
  command: SavingsAccountTransactionCommand
): Promise<
  | {
      ok: true;
      paymentTypeOptions: { id: number; name: string }[];
    }
  | { ok: false; message: string }
> {
  const permission = TRANSACTION_PERMISSIONS[command];
  const denied = await requirePermission(
    permission,
    'You do not have permission to perform this transaction.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const template = await getSavingsAccountTransactionTemplate(accountId, command);
    const paymentTypeOptions = (template.paymentTypeOptions ?? [])
      .filter((option) => option.isSystemDefined !== true)
      .map((option) => ({ id: option.id, name: option.name }));
    return { ok: true, paymentTypeOptions };
  } catch (error) {
    return toFineractActionError(error, 'Could not load transaction template.');
  }
}

export async function loadSavingsAccountBlockReasonsAction(): Promise<
  | { ok: true; reasons: { id: number; name: string }[] }
  | { ok: false; message: string }
> {
  const denied = await requirePermission(
    'BLOCK_SAVINGSACCOUNT',
    'You do not have permission to block savings accounts.'
  );
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const rows = await listCodeValues(SAVINGS_ACCOUNT_BLOCK_REASON_CODE_ID);
    const reasons = rows
      .filter((row) => row.active !== false && row.isActive !== false)
      .map((row) => ({ id: row.id, name: row.name }));
    return { ok: true, reasons };
  } catch (error) {
    return toFineractActionError(error, 'Could not load block reasons.');
  }
}

export async function executeSavingsAccountLifecycleCommandAction(
  clientId: string,
  accountId: string,
  command: SavingsAccountLifecycleCommand,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const permission = LIFECYCLE_PERMISSIONS[command];
  const denied = await requirePermission(permission, 'You do not have permission for this action.');
  if (denied) {
    return denied;
  }

  try {
    switch (command) {
      case 'approve': {
        const parsed = parseOrError(savingsAccountApproveCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              approvedOnDate: parsed.data.approvedOnDate,
              note: parsed.data.note
            })
          )
        );
        break;
      }
      case 'activate': {
        const parsed = parseOrError(savingsAccountActivateCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody({ activatedOnDate: parsed.data.activatedOnDate })
        );
        break;
      }
      case 'reject': {
        const parsed = parseOrError(savingsAccountRejectCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              rejectedOnDate: parsed.data.rejectedOnDate,
              note: parsed.data.note
            })
          )
        );
        break;
      }
      case 'withdrawnByApplicant': {
        const parsed = parseOrError(savingsAccountWithdrawnByApplicantCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              withdrawnOnDate: parsed.data.withdrawnOnDate,
              note: parsed.data.note
            })
          )
        );
        break;
      }
      case 'undoApproval': {
        const parsed = parseOrError(savingsAccountUndoApprovalCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        const body = parsed.data.note?.trim() ? { note: parsed.data.note.trim() } : {};
        await executeSavingsAccountCommand(accountId, command, body);
        break;
      }
      case 'close': {
        const parsed = parseOrError(savingsAccountCloseCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody(
            omitEmptyStrings({
              closedOnDate: parsed.data.closedOnDate,
              note: parsed.data.note,
              withdrawBalance: parsed.data.withdrawBalance === true,
              paymentTypeId: parsed.data.withdrawBalance ? parsed.data.paymentTypeId : undefined,
              accountNumber: parsed.data.accountNumber,
              checkNumber: parsed.data.checkNumber,
              routingCode: parsed.data.routingCode,
              receiptNumber: parsed.data.receiptNumber,
              bankNumber: parsed.data.bankNumber
            })
          )
        );
        break;
      }
      case 'block':
      case 'blockCredit':
      case 'blockDebit': {
        const parsed = parseOrError(savingsAccountBlockCommandSchema, raw);
        if (!parsed.success) {
          return parsed.result;
        }
        await executeSavingsAccountCommand(
          accountId,
          command,
          buildFineractCommandBody({ reasonForBlock: parsed.data.reasonForBlock })
        );
        break;
      }
      case 'unblock':
      case 'unblockCredit':
      case 'unblockDebit': {
        await executeSavingsAccountCommand(accountId, command, buildFineractCommandBody({}));
        break;
      }
      default: {
        const _exhaustive: never = command;
        return _exhaustive;
      }
    }

    revalidateSavingsAccountPaths(clientId, accountId);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not complete savings account action.');
  }
}

export async function executeSavingsAccountTransactionCommandAction(
  clientId: string,
  accountId: string,
  command: SavingsAccountTransactionCommand,
  raw: unknown
): Promise<SavingsAccountActionResult> {
  const permission = TRANSACTION_PERMISSIONS[command];
  const denied = await requirePermission(
    permission,
    'You do not have permission to perform this transaction.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(savingsAccountTransactionCommandSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    await executeSavingsAccountTransaction(
      accountId,
      command,
      buildFineractCommandBody(
        omitEmptyStrings({
          transactionDate: parsed.data.transactionDate,
          transactionAmount: parsed.data.transactionAmount,
          paymentTypeId: parsed.data.paymentTypeId,
          accountNumber: parsed.data.accountNumber,
          checkNumber: parsed.data.checkNumber,
          routingCode: parsed.data.routingCode,
          receiptNumber: parsed.data.receiptNumber,
          bankNumber: parsed.data.bankNumber,
          note: parsed.data.note
        })
      )
    );
    revalidateSavingsAccountPaths(clientId, accountId);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not complete transaction.');
  }
}

'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type { LoanScheduleData } from '@mifos/api-client';
import {
  actionSuccessFromFineractCommand,
  loanVariableScheduleExceptionsSchema,
  toFineractActionError
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  previewLoanVariableSchedule,
  resetLoanVariableSchedule,
  submitLoanVariableSchedule
} from '@/lib/fineract/loan-variable-installments';
import { getServerSession } from '@/lib/session/server';

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

type ActionError = Extract<LoanAccountActionResult, { ok: false }>;

type ParsedResult<T> = { success: true; data: T } | { success: false; result: ActionError };

function parseOrError<T>(schema: z.ZodType<T>, raw: unknown): ParsedResult<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      result: {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: fieldErrorsFromZod(parsed.error.issues)
      }
    };
  }
  return { success: true, data: parsed.data };
}

async function requirePermission(
  permissionKey: 'loans.schedule.adjust' | 'loans.schedule.reset',
  deniedMessage: string
): Promise<{ ok: false; message: string } | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission(permissionKey));
  } catch {
    return { ok: false, message: deniedMessage };
  }
  return null;
}

function revalidateLoanAccountPaths(clientId: string, accountId: string) {
  revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
  revalidatePath(`/clients/${clientId}/loans`);
}

function compactInstallment(row: object): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    result[key] = value;
  }
  return result;
}

function exceptionsBody(data: z.infer<typeof loanVariableScheduleExceptionsSchema>) {
  const exceptions: Record<string, unknown> = {};
  if (data.modifiedinstallments?.length) {
    exceptions.modifiedinstallments = data.modifiedinstallments.map((row) =>
      compactInstallment(row)
    );
  }
  if (data.newinstallments?.length) {
    exceptions.newinstallments = data.newinstallments.map((row) => compactInstallment(row));
  }
  if (data.deletedinstallments?.length) {
    exceptions.deletedinstallments = data.deletedinstallments.map((row) => compactInstallment(row));
  }
  return buildFineractCommandBody({ exceptions });
}

export type LoanVariableSchedulePreviewResult =
  | { ok: true; schedule: LoanScheduleData }
  | ActionError;

export async function previewLoanVariableScheduleAction(
  accountId: string,
  raw: unknown
): Promise<LoanVariableSchedulePreviewResult> {
  const denied = await requirePermission(
    'loans.schedule.adjust',
    'You do not have permission to edit this repayment schedule.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(loanVariableScheduleExceptionsSchema, {
    ...(raw && typeof raw === 'object' ? raw : {}),
    loanId: accountId
  });
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const schedule = await previewLoanVariableSchedule(accountId, exceptionsBody(parsed.data));
    if (!schedule) {
      return { ok: false, message: 'Could not recalculate the repayment schedule.' };
    }
    return { ok: true, schedule };
  } catch (error) {
    return toFineractActionError(error, 'Could not recalculate the repayment schedule.');
  }
}

export async function submitLoanVariableScheduleAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.schedule.adjust',
    'You do not have permission to edit this repayment schedule.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(loanVariableScheduleExceptionsSchema, {
    ...(raw && typeof raw === 'object' ? raw : {}),
    loanId: accountId
  });
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await submitLoanVariableSchedule(accountId, exceptionsBody(parsed.data));
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not save the repayment schedule.');
  }
}

export async function resetLoanVariableScheduleAction(
  clientId: string,
  accountId: string
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.schedule.reset',
    'You do not have permission to restore the original repayment schedule.'
  );
  if (denied) {
    return denied;
  }

  try {
    const response = await resetLoanVariableSchedule(accountId);
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not restore the original repayment schedule.');
  }
}

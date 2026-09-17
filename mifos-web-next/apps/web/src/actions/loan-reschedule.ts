'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import {
  actionSuccessFromFineractCommand,
  approveLoanRescheduleRequestSchema,
  createLoanRescheduleRequestSchema,
  rejectLoanRescheduleRequestSchema,
  toFineractActionError
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import {
  createLoanRescheduleRequest,
  executeLoanRescheduleRequestCommand,
  getLoanRescheduleTemplate
} from '@/lib/fineract/loan-reschedule';
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

type ParsedResult<T> = { success: true; data: T } | { success: false; result: LoanAccountActionResult };

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
  permissionKey: 'loans.reschedule.create' | 'loans.reschedule.approve' | 'loans.reschedule.reject',
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

function omitEmpty(fields: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    result[key] = value;
  }
  return result;
}

export async function loadLoanRescheduleTemplateAction(): Promise<
  | { ok: true; reasons: { id: number; name: string }[] }
  | Extract<LoanAccountActionResult, { ok: false }>
> {
  const denied = await requirePermission(
    'loans.reschedule.create',
    'You do not have permission to reschedule this loan.'
  );
  if (denied) {
    return denied;
  }

  try {
    const template = await getLoanRescheduleTemplate();
    return {
      ok: true,
      reasons: (template.rescheduleReasons ?? [])
        .filter((reason) => reason.active !== false)
        .map((reason) => ({
          id: reason.id,
          name: reason.name?.trim() || `Reason ${reason.id}`
        }))
    };
  } catch (error) {
    return toFineractActionError(error, 'Could not load reschedule reasons.');
  }
}

export async function createLoanRescheduleRequestAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.reschedule.create',
    'You do not have permission to reschedule this loan.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(createLoanRescheduleRequestSchema, {
    ...(raw && typeof raw === 'object' ? raw : {}),
    loanId: accountId
  });
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const {
      loanId,
      rescheduleFromDate,
      rescheduleReasonId,
      submittedOnDate,
      rescheduleReasonComment,
      ...optionalChanges
    } = parsed.data;
    const response = await createLoanRescheduleRequest(
      buildFineractCommandBody(
        omitEmpty({
          loanId,
          rescheduleFromDate,
          rescheduleReasonId,
          submittedOnDate,
          rescheduleReasonComment: rescheduleReasonComment?.trim() || undefined,
          ...optionalChanges
        })
      )
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not submit the reschedule request.');
  }
}

export async function approveLoanRescheduleRequestAction(
  clientId: string,
  accountId: string,
  requestId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.reschedule.approve',
    'You do not have permission to approve this reschedule request.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(approveLoanRescheduleRequestSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await executeLoanRescheduleRequestCommand(
      requestId,
      'approve',
      buildFineractCommandBody(parsed.data)
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not approve the reschedule request.');
  }
}

export async function rejectLoanRescheduleRequestAction(
  clientId: string,
  accountId: string,
  requestId: string,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.reschedule.reject',
    'You do not have permission to reject this reschedule request.'
  );
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(rejectLoanRescheduleRequestSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const response = await executeLoanRescheduleRequestCommand(
      requestId,
      'reject',
      buildFineractCommandBody(parsed.data)
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return actionSuccessFromFineractCommand(response, {});
  } catch (error) {
    return toFineractActionError(error, 'Could not reject the reschedule request.');
  }
}

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
  loanAccountAssignOfficerSchema,
  toFineractActionError
} from '@mifos/validation';
import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LOAN_OFFICER_CONFIG } from '@/lib/fineract/account-field-officer-config';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import { buildFineractCommandBody } from '@/lib/fineract/client-command-body';
import {
  executeLoanAccountCommand,
  getLoanAccount,
  getLoanOfficerAssignTemplate
} from '@/lib/fineract/loan-accounts';
import { getServerSession } from '@/lib/session/server';

export type LoanAccountOfficerActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

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

type ParsedResult<T> = { success: true; data: T } | { success: false; result: LoanAccountOfficerActionResult };

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

async function requireAssignPermission(): Promise<{ ok: false; message: string } | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, LOAN_OFFICER_CONFIG.assignPermission);
  } catch {
    return { ok: false, message: 'You do not have permission to assign loan officers.' };
  }
  return null;
}

async function requireAllPermissions(): Promise<{ ok: false; message: string } | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, {
      all: [LOAN_OFFICER_CONFIG.assignPermission, LOAN_OFFICER_CONFIG.removePermission]
    });
  } catch {
    return {
      ok: false,
      message: 'You need permission to assign and remove loan officers to reassign.'
    };
  }
  return null;
}

function revalidateLoanAccountPaths(clientId: string, accountId: string | number) {
  revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
  revalidatePath(`/clients/${clientId}/loans`);
}

export async function loadLoanAccountAssignOfficerSheetDataAction(
  accountId: string
): Promise<
  | { ok: true; officerOptions: { id: number; name: string }[] }
  | { ok: false; message: string }
> {
  const denied = await requireAssignPermission();
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const template = await getLoanOfficerAssignTemplate(accountId);
    return { ok: true, officerOptions: template.loanOfficerOptions };
  } catch (error) {
    return toFineractActionError(error, 'Could not load loan officers.');
  }
}

export async function loadLoanAccountReassignOfficerSheetDataAction(
  accountId: string
): Promise<
  | {
      ok: true;
      currentOfficerName: string;
      officerOptions: { id: number; name: string }[];
    }
  | { ok: false; message: string }
> {
  const denied = await requireAllPermissions();
  if (denied) {
    return { ok: false, message: denied.message };
  }

  try {
    const [account, template] = await Promise.all([
      getLoanAccount(accountId),
      getLoanOfficerAssignTemplate(accountId)
    ]);
    if (!account) {
      return { ok: false, message: 'Loan account not found.' };
    }
    const currentOfficerId = account.loanOfficerId;
    if (!currentOfficerId) {
      return { ok: false, message: 'No loan officer is assigned.' };
    }
    const currentOfficerName =
      account.loanOfficerName?.trim() || `Loan officer ${currentOfficerId}`;
    const officerOptions = template.loanOfficerOptions.filter(
      (row) => row.id !== currentOfficerId
    );
    return { ok: true, currentOfficerName, officerOptions };
  } catch (error) {
    return toFineractActionError(error, 'Could not load loan officers.');
  }
}

export async function executeLoanAccountAssignOfficerAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountOfficerActionResult> {
  const denied = await requireAssignPermission();
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(loanAccountAssignOfficerSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    await executeLoanAccountCommand(
      accountId,
      'assignLoanOfficer',
      buildFineractCommandBody({
        toLoanOfficerId: parsed.data.toLoanOfficerId,
        assignmentDate: parsed.data.assignmentDate,
        fromLoanOfficerId: ''
      })
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not assign loan officer.');
  }
}

export async function executeLoanAccountReassignOfficerAction(
  clientId: string,
  accountId: string,
  raw: unknown
): Promise<LoanAccountOfficerActionResult> {
  const denied = await requireAllPermissions();
  if (denied) {
    return denied;
  }

  const parsed = parseOrError(loanAccountAssignOfficerSchema, raw);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const account = await getLoanAccount(accountId);
    if (!account) {
      return { ok: false, message: 'Loan account not found.' };
    }
    const currentOfficerId = account.loanOfficerId;
    if (!currentOfficerId) {
      return { ok: false, message: 'No loan officer is assigned.' };
    }
    if (parsed.data.toLoanOfficerId === currentOfficerId) {
      return {
        ok: false,
        message: 'Fix the highlighted fields.',
        fieldErrors: { toLoanOfficerId: 'Select a different loan officer.' }
      };
    }

    const reassignmentDate = parsed.data.assignmentDate;
    await executeLoanAccountCommand(
      accountId,
      'unassignLoanOfficer',
      buildFineractCommandBody({ unassignedDate: reassignmentDate })
    );
    await executeLoanAccountCommand(
      accountId,
      'assignLoanOfficer',
      buildFineractCommandBody({
        toLoanOfficerId: parsed.data.toLoanOfficerId,
        assignmentDate: reassignmentDate,
        fromLoanOfficerId: currentOfficerId
      })
    );
    revalidateLoanAccountPaths(clientId, accountId);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Could not reassign loan officer.');
  }
}

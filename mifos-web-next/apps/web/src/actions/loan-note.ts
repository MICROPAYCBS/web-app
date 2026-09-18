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
  clientNoteSchema,
  toFineractActionError,
  type ClientNoteInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import type { LoanAccountActionResult } from '@/lib/fineract/loan-account-action-result';
import { createLoanNote, deleteLoanNote, updateLoanNote } from '@/lib/fineract/loan-notes';
import { getServerSession } from '@/lib/session/server';

async function requirePermission(
  key: 'loans.notes.create' | 'loans.notes.update' | 'loans.notes.delete',
  message: string
): Promise<LoanAccountActionResult | null> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: 'You must be signed in.' };
  }
  try {
    assertCan(session, resolvePermission(key));
  } catch {
    return { ok: false, message };
  }
  return null;
}

function parseNote(raw: unknown): LoanAccountActionResult | ClientNoteInput {
  const parsed = clientNoteSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: 'Please fix the highlighted fields.',
      fieldErrors
    };
  }
  return parsed.data;
}

export async function createLoanNoteAction(
  clientId: string,
  accountId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.notes.create',
    'You do not have permission to add notes.'
  );
  if (denied) {
    return denied;
  }
  const parsed = parseNote(raw);
  if ('ok' in parsed) {
    return parsed;
  }
  try {
    const response = await createLoanNote(accountId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function updateLoanNoteAction(
  clientId: string,
  accountId: number,
  noteId: number,
  raw: unknown
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.notes.update',
    'You do not have permission to update notes.'
  );
  if (denied) {
    return denied;
  }
  const parsed = parseNote(raw);
  if ('ok' in parsed) {
    return parsed;
  }
  try {
    const response = await updateLoanNote(accountId, noteId, parsed);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

export async function deleteLoanNoteAction(
  clientId: string,
  accountId: number,
  noteId: number
): Promise<LoanAccountActionResult> {
  const denied = await requirePermission(
    'loans.notes.delete',
    'You do not have permission to delete notes.'
  );
  if (denied) {
    return denied;
  }
  try {
    const response = await deleteLoanNote(accountId, noteId);
    revalidatePath(clientAccountGeneralPath(clientId, 'loan', accountId));
    return actionSuccessFromFineractCommand(response, {});
  } catch (err) {
    return toFineractActionError(err, 'Request failed.');
  }
}

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
  toFineractActionError,
  validateCreateJournalEntryForm,
  validateRevertJournalEntry,
  type CreateJournalEntryFormInput,
  type RevertJournalEntryInput,
  actionSuccessFromFineractCommand
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createJournalEntry,
  listJournalEntryGlAccounts,
  revertJournalEntryTransaction
} from '@/lib/fineract/journal-entries';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/journal-entries';
const REQUIRE_DEPARTMENT_CONFIG = 'enable-require-department-on-manual-journal-pl-lines';

export type JournalEntriesActionResult =
  | { ok: true; transactionId?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function transactionPath(transactionId: string) {
  return `${LIST_PATH}/transactions/${transactionId}`;
}

function zodFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.[0]) {
      fieldErrors[key] = messages[0];
    }
  }
  return fieldErrors;
}

function revalidateJournalEntryViews(transactionId?: string) {
  revalidatePath(LIST_PATH);
  if (transactionId) {
    revalidatePath(transactionPath(transactionId));
  }
}

export async function createJournalEntryAction(
  input: CreateJournalEntryFormInput
): Promise<JournalEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to create journal entries.' };
  }

  const [departmentConfig, glAccounts] = await Promise.all([
    getGlobalConfigurationByName(REQUIRE_DEPARTMENT_CONFIG),
    listJournalEntryGlAccounts()
  ]);
  const glAccountTypesById = Object.fromEntries(
    glAccounts
      .filter((account) => account.typeId != null)
      .map((account) => [account.id, account.typeId as number])
  );

  const parsed = validateCreateJournalEntryForm(input, {
    requireDepartmentOnPlLines: departmentConfig?.enabled ?? false,
    glAccountTypesById
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createJournalEntry(parsed.data);
    revalidateJournalEntryViews(response.transactionId);
    return actionSuccessFromFineractCommand(response, { transactionId: response.transactionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to create journal entry.');
  }
}

export async function revertJournalEntryAction(
  transactionId: string,
  input: RevertJournalEntryInput
): Promise<JournalEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'REVERSE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to reverse journal entries.' };
  }

  if (!transactionId.trim()) {
    return { ok: false, message: 'Invalid transaction id.' };
  }

  const parsed = validateRevertJournalEntry(input);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid request.' };
  }

  try {
    const response = await revertJournalEntryTransaction(transactionId, parsed.data);
    revalidateJournalEntryViews(response.transactionId);
    return actionSuccessFromFineractCommand(response, { transactionId: response.transactionId });
  } catch (error) {
    return toFineractActionError(error, 'Failed to reverse journal entry.');
  }
}

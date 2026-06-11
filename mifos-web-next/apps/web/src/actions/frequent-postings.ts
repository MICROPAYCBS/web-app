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
  validateCreateFrequentPostingForm,
  type CreateFrequentPostingFormInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createFrequentPosting } from '@/lib/fineract/journal-entries';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/journal-entries';
const FREQUENT_POSTINGS_PATH = `${LIST_PATH}/frequent-postings`;

export type FrequentPostingsActionResult =
  | { ok: true; transactionId?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

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

function revalidateFrequentPostingViews(transactionId?: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(FREQUENT_POSTINGS_PATH);
  if (transactionId) {
    revalidatePath(`${LIST_PATH}/transactions/${transactionId}`);
  }
}

export async function createFrequentPostingAction(
  input: CreateFrequentPostingFormInput
): Promise<FrequentPostingsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to create journal entries.' };
  }

  const parsed = validateCreateFrequentPostingForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createFrequentPosting(parsed.data);
    revalidateFrequentPostingViews(response.transactionId);
    return { ok: true, transactionId: response.transactionId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create frequent posting.');
  }
}

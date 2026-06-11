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
  validateCreateProvisioningEntry,
  type CreateProvisioningEntryInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createProvisioningEntry,
  createProvisioningJournalEntries,
  recreateProvisioningEntry
} from '@/lib/fineract/provisioning-entries';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/accounting/provisioning-entries';

export type ProvisioningEntriesActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function entryPath(entryId: number | string) {
  return `${LIST_PATH}/${entryId}`;
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

function revalidateProvisioningViews(entryId?: number) {
  revalidatePath(LIST_PATH);
  if (entryId != null) {
    revalidatePath(entryPath(entryId));
    revalidatePath(`${entryPath(entryId)}/journal-entries`);
  }
}

export async function createProvisioningEntryAction(
  input: CreateProvisioningEntryInput
): Promise<ProvisioningEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_PROVISIONING_ENTRIES');
  } catch {
    return { ok: false, message: 'You do not have permission to create provisioning entries.' };
  }

  const parsed = validateCreateProvisioningEntry(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createProvisioningEntry(parsed.data);
    revalidateProvisioningViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create provisioning entry.');
  }
}

export async function recreateProvisioningEntryAction(
  entryId: number
): Promise<ProvisioningEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_PROVISIONING_ENTRIES');
  } catch {
    return { ok: false, message: 'You do not have permission to recreate provisioning entries.' };
  }

  if (!Number.isFinite(entryId)) {
    return { ok: false, message: 'Invalid entry id.' };
  }

  try {
    const response = await recreateProvisioningEntry(entryId);
    revalidateProvisioningViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to recreate provisioning entry.');
  }
}

export async function createProvisioningJournalEntriesAction(
  entryId: number
): Promise<ProvisioningEntriesActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_JOURNALENTRY');
  } catch {
    return { ok: false, message: 'You do not have permission to create journal entries.' };
  }

  if (!Number.isFinite(entryId)) {
    return { ok: false, message: 'Invalid entry id.' };
  }

  try {
    const response = await createProvisioningJournalEntries(entryId);
    revalidateProvisioningViews(entryId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create journal entries.');
  }
}

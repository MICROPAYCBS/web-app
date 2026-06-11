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
  toFineractActionError,
  validateUpsertAdhocQuery,
  type UpsertAdhocQueryInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  ADHOC_QUERY_LIST_PATH,
  adhocQueryDetailPath,
  adhocQueryEditPath
} from '@/lib/fineract/adhoc-query-paths';
import {
  createAdhocQuery,
  deleteAdhocQuery,
  updateAdhocQuery
} from '@/lib/fineract/adhoc-query';
import { getServerSession } from '@/lib/session/server';

export type AdhocQueryActionResult =
  | { ok: true; adhocQueryId?: number }
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

function revalidateAdhocQueryViews(adhocQueryId: string | number) {
  revalidatePath(ADHOC_QUERY_LIST_PATH);
  revalidatePath(adhocQueryDetailPath(adhocQueryId));
  revalidatePath(adhocQueryEditPath(adhocQueryId));
}

export async function createAdhocQueryAction(
  input: UpsertAdhocQueryInput
): Promise<AdhocQueryActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.adhocQuery.create'));
  } catch {
    return { ok: false, message: 'You do not have permission to create ad hoc queries.' };
  }

  const parsed = validateUpsertAdhocQuery(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createAdhocQuery(parsed.data);
    revalidatePath(ADHOC_QUERY_LIST_PATH);
    return { ok: true, adhocQueryId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create ad hoc query.');
  }
}

export async function updateAdhocQueryAction(
  adhocQueryId: string | number,
  input: UpsertAdhocQueryInput
): Promise<AdhocQueryActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.adhocQuery.update'));
  } catch {
    return { ok: false, message: 'You do not have permission to update ad hoc queries.' };
  }

  const parsed = validateUpsertAdhocQuery(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await updateAdhocQuery(adhocQueryId, parsed.data);
    revalidateAdhocQueryViews(adhocQueryId);
    return { ok: true, adhocQueryId: response.resourceId ?? Number(adhocQueryId) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update ad hoc query.');
  }
}

export async function deleteAdhocQueryAction(
  adhocQueryId: string | number
): Promise<AdhocQueryActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, resolvePermission('organization.adhocQuery.delete'));
  } catch {
    return { ok: false, message: 'You do not have permission to delete ad hoc queries.' };
  }

  try {
    await deleteAdhocQuery(adhocQueryId);
    revalidatePath(ADHOC_QUERY_LIST_PATH);
    return { ok: true, adhocQueryId: Number(adhocQueryId) };
  } catch (error) {
    return toFineractActionError(error, 'Failed to delete ad hoc query.');
  }
}

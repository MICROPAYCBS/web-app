'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  BulkLoanReassignmentOfficeTemplate,
  BulkLoanReassignmentOfficerTemplate
} from '@mifos/api-client';
import { assertCan, resolvePermission } from '@mifos/auth';
import {
  toFineractActionError,
  validateBulkLoanReassignment,
  type BulkLoanReassignmentInput
} from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import {
  createBulkLoanReassignment,
  getBulkLoanReassignmentOfficeTemplate,
  getBulkLoanReassignmentOfficerTemplate
} from '@/lib/fineract/bulk-loan-reassignment';
import { BULK_LOAN_REASSIGNMENT_PATH } from '@/lib/fineract/bulk-loan-reassignment-paths';
import { getServerSession } from '@/lib/session/server';

export type BulkLoanReassignmentActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type BulkLoanReassignmentTemplateResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

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

function assertBulkLoanPermission(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('organization.bulkLoan'));
}

export async function loadBulkLoanReassignmentOfficeTemplateAction(
  officeId: string | number
): Promise<BulkLoanReassignmentTemplateResult<BulkLoanReassignmentOfficeTemplate>> {
  const session = await getServerSession();
  try {
    assertBulkLoanPermission(session);
  } catch {
    return { ok: false, message: 'You do not have permission to reassign loans.' };
  }

  try {
    const data = await getBulkLoanReassignmentOfficeTemplate(officeId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load loan officers for the selected branch.');
  }
}

export async function loadBulkLoanReassignmentOfficerTemplateAction(
  officeId: string | number,
  fromLoanOfficerId: string | number
): Promise<BulkLoanReassignmentTemplateResult<BulkLoanReassignmentOfficerTemplate>> {
  const session = await getServerSession();
  try {
    assertBulkLoanPermission(session);
  } catch {
    return { ok: false, message: 'You do not have permission to reassign loans.' };
  }

  try {
    const data = await getBulkLoanReassignmentOfficerTemplate(officeId, fromLoanOfficerId);
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load loans for the selected loan officer.');
  }
}

export async function submitBulkLoanReassignmentAction(
  input: BulkLoanReassignmentInput
): Promise<BulkLoanReassignmentActionResult> {
  const session = await getServerSession();
  try {
    assertBulkLoanPermission(session);
  } catch {
    return { ok: false, message: 'You do not have permission to reassign loans.' };
  }

  const parsed = validateBulkLoanReassignment(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await createBulkLoanReassignment(parsed.data);
    revalidatePath(BULK_LOAN_REASSIGNMENT_PATH);
    return { ok: true };
  } catch (error) {
    return toFineractActionError(error, 'Failed to reassign loans.');
  }
}

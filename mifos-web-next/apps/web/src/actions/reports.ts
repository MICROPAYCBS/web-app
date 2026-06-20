'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan } from '@mifos/auth';
import { toFineractActionError, validateUpsertReportForm, type UpsertReportFormInput } from '@mifos/validation';
import { revalidatePath } from 'next/cache';
import { createReport, deleteReport, getReport, updateReport } from '@/lib/fineract/reports';
import {
  formatReportDeletePermissionError,
  isMissingReportReadPermissionError
} from '@/lib/fineract/report-permissions';
import { getServerSession } from '@/lib/session/server';

const LIST_PATH = '/system/reports';

export type ReportsActionResult =
  | { ok: true; resourceId?: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function reportPath(reportId: number | string) {
  return `${LIST_PATH}/${reportId}`;
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

function revalidateReportViews(reportId?: number) {
  revalidatePath(LIST_PATH);
  if (reportId != null) {
    revalidatePath(reportPath(reportId));
    revalidatePath(`${reportPath(reportId)}/edit`);
  }
}

export async function createReportAction(input: UpsertReportFormInput): Promise<ReportsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'CREATE_REPORT');
  } catch {
    return { ok: false, message: 'You do not have permission to create reports.' };
  }

  const parsed = validateUpsertReportForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    const response = await createReport(parsed.data);
    revalidateReportViews(response.resourceId);
    return { ok: true, resourceId: response.resourceId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to create report.');
  }
}

export async function updateReportAction(
  reportId: number,
  input: UpsertReportFormInput
): Promise<ReportsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'UPDATE_REPORT');
  } catch {
    return { ok: false, message: 'You do not have permission to update reports.' };
  }

  const existing = await getReport(reportId);
  if (!existing) {
    return { ok: false, message: 'Report not found.' };
  }

  const parsed = validateUpsertReportForm(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Fix the highlighted fields.',
      fieldErrors: zodFieldErrors(parsed.error)
    };
  }

  try {
    await updateReport(reportId, parsed.data, { coreReport: existing.coreReport });
    revalidateReportViews(reportId);
    return { ok: true, resourceId: reportId };
  } catch (error) {
    return toFineractActionError(error, 'Failed to update report.');
  }
}

export async function deleteReportAction(reportId: number): Promise<ReportsActionResult> {
  const session = await getServerSession();
  try {
    assertCan(session, 'DELETE_REPORT');
  } catch {
    return { ok: false, message: 'You do not have permission to delete reports.' };
  }

  const existing = await getReport(reportId);
  if (!existing) {
    return { ok: false, message: 'Report not found.' };
  }
  if (existing.coreReport) {
    return { ok: false, message: 'Core reports cannot be deleted.' };
  }

  try {
    await deleteReport(reportId, existing.reportName);
    revalidateReportViews();
    return { ok: true };
  } catch (error) {
    if (isMissingReportReadPermissionError(error, existing.reportName)) {
      return { ok: false, message: formatReportDeletePermissionError(existing.reportName) };
    }
    return toFineractActionError(error, 'Failed to delete report.');
  }
}

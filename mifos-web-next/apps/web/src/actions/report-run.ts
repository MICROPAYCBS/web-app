'use server';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import type {
  FineractReportRunParameterMetadata,
  FineractReportRunParameterOption,
  FineractReportRunResult
} from '@mifos/api-client';
import { toFineractActionError } from '@mifos/validation';
import { buildReportRunQueryParams } from '@/lib/fineract/report-run-display';
import {
  fetchReportParameterMetadata,
  fetchReportParameterOptions,
  runReport
} from '@/lib/fineract/run-reports';
import { getServerSession } from '@/lib/session/server';

type ReportRunActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function assertCanRunReports(session: Awaited<ReturnType<typeof getServerSession>>) {
  assertCan(session, resolvePermission('administration.reports'));
}

export async function fetchReportParameterMetadataAction(
  reportName: string
): Promise<ReportRunActionResult<FineractReportRunParameterMetadata[]>> {
  const session = await getServerSession();
  try {
    assertCanRunReports(session);
  } catch {
    return { ok: false, message: 'You do not have permission to run reports.' };
  }

  if (!reportName.trim()) {
    return { ok: false, message: 'Report name is required.' };
  }

  try {
    const data = await fetchReportParameterMetadata(reportName.trim());
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load report parameters.');
  }
}

export async function fetchReportParameterOptionsAction(input: {
  parameterReportName: string;
  parentVariable?: string;
  parentValue?: string;
}): Promise<ReportRunActionResult<FineractReportRunParameterOption[]>> {
  const session = await getServerSession();
  try {
    assertCanRunReports(session);
  } catch {
    return { ok: false, message: 'You do not have permission to run reports.' };
  }

  if (!input.parameterReportName.trim()) {
    return { ok: false, message: 'Parameter report name is required.' };
  }

  try {
    const data = await fetchReportParameterOptions(
      input.parameterReportName.trim(),
      input.parentVariable && input.parentValue
        ? { variable: input.parentVariable, value: input.parentValue }
        : undefined
    );
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to load parameter options.');
  }
}

export async function runReportAction(input: {
  reportName: string;
  parameters: Record<string, string>;
}): Promise<ReportRunActionResult<FineractReportRunResult>> {
  const session = await getServerSession();
  try {
    assertCanRunReports(session);
  } catch {
    return { ok: false, message: 'You do not have permission to run reports.' };
  }

  if (!input.reportName.trim()) {
    return { ok: false, message: 'Report name is required.' };
  }

  try {
    const data = await runReport(
      input.reportName.trim(),
      buildReportRunQueryParams(input.parameters)
    );
    return { ok: true, data };
  } catch (error) {
    return toFineractActionError(error, 'Failed to run report.');
  }
}

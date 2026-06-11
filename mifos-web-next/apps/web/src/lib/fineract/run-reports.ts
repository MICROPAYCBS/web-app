import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportRunParameterMetadata,
  FineractReportRunParameterOption,
  FineractReportRunResult
} from '@mifos/api-client';
import {
  parseReportParameterMetadata,
  parseReportParameterOptions
} from '@/lib/fineract/report-run-display';
import { createFineractClient } from '@/lib/fineract/create-client';

function runReportPath(reportName: string): string {
  return `/runreports/${encodeURIComponent(reportName)}`;
}

export async function fetchReportParameterMetadata(
  reportName: string
): Promise<FineractReportRunParameterMetadata[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<FineractReportRunResult>('/runreports/FullParameterList', {
    R_reportListing: `'${reportName}'`,
    parameterType: 'true'
  });
  return parseReportParameterMetadata(raw);
}

export async function fetchReportParameterOptions(
  parameterReportName: string,
  parent?: { variable: string; value: string }
): Promise<FineractReportRunParameterOption[]> {
  const searchParams: Record<string, string> = { parameterType: 'true' };
  if (parent?.variable && parent.value) {
    searchParams[`R_${parent.variable}`] = parent.value;
  }
  const fineract = await createFineractClient();
  const raw = await fineract.get<FineractReportRunResult>(
    runReportPath(parameterReportName),
    searchParams
  );
  return parseReportParameterOptions(raw);
}

export async function runReport(
  reportName: string,
  parameters: Record<string, string>
): Promise<FineractReportRunResult> {
  const fineract = await createFineractClient();
  return fineract.get<FineractReportRunResult>(runReportPath(reportName), parameters);
}

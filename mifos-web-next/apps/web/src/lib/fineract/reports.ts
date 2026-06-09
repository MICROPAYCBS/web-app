import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportDetail,
  FineractReportListItem,
  FineractReportMutationResponse,
  FineractReportTemplate
} from '@mifos/api-client';
import type { UpsertReportFormInput } from '@mifos/validation';
import { buildCreateReportPayload, buildUpdateReportPayload } from '@mifos/validation';
import { createFineractClient } from '@/lib/fineract/create-client';

const REPORTS_PATH = '/reports';

function normalizeAllowedParameter(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const parameterName = typeof row.parameterName === 'string' ? row.parameterName : '';
  if (!Number.isFinite(id) || !parameterName) {
    return null;
  }
  return { id, parameterName };
}

function normalizeReportParameter(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const parameterId = Number(row.parameterId);
  if (!Number.isFinite(parameterId)) {
    return null;
  }
  return {
    id: row.id as string | number | undefined,
    parameterId,
    parameterName: typeof row.parameterName === 'string' ? row.parameterName : undefined,
    reportParameterName:
      typeof row.reportParameterName === 'string' ? row.reportParameterName : undefined
  };
}

function normalizeReportListItem(raw: unknown): FineractReportListItem | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  const reportName = typeof row.reportName === 'string' ? row.reportName : '';
  const reportType = typeof row.reportType === 'string' ? row.reportType : '';
  if (!Number.isFinite(id) || !reportName || !reportType) {
    return null;
  }
  return {
    id,
    reportName,
    reportType,
    reportSubType: typeof row.reportSubType === 'string' ? row.reportSubType : undefined,
    reportCategory: typeof row.reportCategory === 'string' ? row.reportCategory : undefined,
    coreReport: row.coreReport === true,
    useReport: row.useReport === true
  };
}

function normalizeReportTemplate(raw: unknown): FineractReportTemplate {
  if (!raw || typeof raw !== 'object') {
    return { allowedReportTypes: [], allowedReportSubTypes: [], allowedParameters: [] };
  }
  const row = raw as Record<string, unknown>;
  return {
    allowedReportTypes: Array.isArray(row.allowedReportTypes)
      ? row.allowedReportTypes.filter((item): item is string => typeof item === 'string')
      : [],
    allowedReportSubTypes: Array.isArray(row.allowedReportSubTypes)
      ? row.allowedReportSubTypes.filter((item): item is string => typeof item === 'string')
      : [],
    allowedParameters: Array.isArray(row.allowedParameters)
      ? row.allowedParameters
          .map((item) => normalizeAllowedParameter(item))
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : []
  };
}

function normalizeReportDetail(raw: unknown): FineractReportDetail | null {
  const summary = normalizeReportListItem(raw);
  if (!summary || !raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const template = normalizeReportTemplate(raw);
  return {
    ...summary,
    description: typeof row.description === 'string' ? row.description : undefined,
    reportSql: typeof row.reportSql === 'string' ? row.reportSql : undefined,
    reportParameters: Array.isArray(row.reportParameters)
      ? row.reportParameters
          .map((item) => normalizeReportParameter(item))
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [],
    allowedReportTypes: template.allowedReportTypes,
    allowedReportSubTypes: template.allowedReportSubTypes,
    allowedParameters: template.allowedParameters
  };
}

export async function listReports(): Promise<FineractReportListItem[]> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(REPORTS_PATH);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeReportListItem(item))
    .filter((item): item is FineractReportListItem => item !== null)
    .sort((a, b) => a.reportName.localeCompare(b.reportName));
}

export async function getReportTemplate(): Promise<FineractReportTemplate> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${REPORTS_PATH}/template`);
  return normalizeReportTemplate(raw);
}

export async function getReport(reportId: number): Promise<FineractReportDetail | null> {
  const fineract = await createFineractClient();
  const raw = await fineract.get<unknown>(`${REPORTS_PATH}/${reportId}`, { template: 'true' });
  return normalizeReportDetail(raw);
}

export async function createReport(input: UpsertReportFormInput): Promise<FineractReportMutationResponse> {
  const fineract = await createFineractClient();
  const payload = buildCreateReportPayload(input);
  const raw = await fineract.post<FineractReportMutationResponse>(REPORTS_PATH, payload);
  return { resourceId: Number(raw?.resourceId) };
}

export async function updateReport(
  reportId: number,
  input: UpsertReportFormInput,
  options: { coreReport: boolean }
): Promise<void> {
  const fineract = await createFineractClient();
  const payload = buildUpdateReportPayload(input, options);
  await fineract.put(`${REPORTS_PATH}/${reportId}`, payload);
}

export async function deleteReport(reportId: number): Promise<void> {
  const fineract = await createFineractClient();
  await fineract.delete(`${REPORTS_PATH}/${reportId}`);
}

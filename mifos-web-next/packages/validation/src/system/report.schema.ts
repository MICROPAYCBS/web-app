/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const REPORT_CATEGORIES = ['Client', 'Loan', 'Savings', 'Fund', 'Accounting'] as const;

const SQL_OPTIONAL_REPORT_TYPES = new Set(['Pentaho', 'BIRT']);

export const reportParameterInputSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  parameterId: z.number().int().positive('Select a parameter.'),
  reportParameterName: z.string().trim().optional()
});

export const upsertReportFormSchema = z
  .object({
    reportName: z.string().trim().min(1, 'Report name is required.'),
    reportType: z.string().trim().min(1, 'Report type is required.'),
    reportSubType: z.string().trim().optional(),
    reportCategory: z.union([z.enum(REPORT_CATEGORIES), z.literal('')]).optional(),
    description: z.string().optional(),
    useReport: z.boolean().default(false),
    reportSql: z.string().optional(),
    reportParameters: z.array(reportParameterInputSchema).optional()
  })
  .superRefine((value, ctx) => {
    if (value.reportType === 'Chart' && !value.reportSubType?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Report sub-type is required for chart reports.',
        path: ['reportSubType']
      });
    }
    if (!SQL_OPTIONAL_REPORT_TYPES.has(value.reportType) && !value.reportSql?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Report SQL is required for this report type.',
        path: ['reportSql']
      });
    }
  });

export const updateCoreReportFormSchema = z.object({
  useReport: z.boolean(),
  description: z.string().optional()
});

export type ReportParameterInput = z.infer<typeof reportParameterInputSchema>;
export type UpsertReportFormInput = z.infer<typeof upsertReportFormSchema>;
export type UpdateCoreReportFormInput = z.infer<typeof updateCoreReportFormSchema>;

export function validateUpsertReportForm(input: unknown) {
  return upsertReportFormSchema.safeParse(input);
}

export function validateUpdateCoreReportForm(input: unknown) {
  return updateCoreReportFormSchema.safeParse(input);
}

export function buildCreateReportPayload(input: UpsertReportFormInput) {
  return {
    reportName: input.reportName,
    reportType: input.reportType,
    reportSubType: input.reportSubType?.trim() || undefined,
    reportCategory: input.reportCategory || undefined,
    description: input.description?.trim() || undefined,
    useReport: input.useReport,
    reportSql: SQL_OPTIONAL_REPORT_TYPES.has(input.reportType)
      ? undefined
      : input.reportSql?.trim() || undefined,
    reportParameters: (input.reportParameters ?? []).map((parameter) => ({
      id: parameter.id ?? '',
      parameterId: parameter.parameterId,
      reportParameterName: parameter.reportParameterName?.trim() || undefined
    }))
  };
}

export function buildUpdateReportPayload(
  input: UpsertReportFormInput,
  options: { coreReport: boolean }
) {
  if (options.coreReport) {
    return {
      useReport: input.useReport,
      description: input.description?.trim() || undefined
    };
  }
  return buildCreateReportPayload(input);
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  validateUpdateCoreReportForm,
  validateUpsertReportForm,
  type UpsertReportFormInput
} from '@mifos/validation';
import type { ReportParameterRow } from '@/components/system/report-parameters-editor';
import { isSqlDisabledForReportType } from '@/lib/fineract/report-display';
import type { ReportWizardDraft, StepErrors } from './types';

const CUSTOM_STEP_FIELDS: Record<string, readonly string[]> = {
  details: ['reportName', 'reportType', 'reportSubType', 'reportCategory'],
  query: ['reportSql'],
  parameters: ['reportParameters']
};

export function draftToPayload(draft: ReportWizardDraft): UpsertReportFormInput {
  return {
    ...draft.form,
    reportParameters: draft.parameters
      .filter((parameter) => parameter.parameterId > 0)
      .map((parameter) => ({
        id: parameter.id,
        parameterId: parameter.parameterId,
        reportParameterName: parameter.reportParameterName
      }))
  };
}

function normalizeReportParameters(parameters: ReportParameterRow[]) {
  return parameters
    .filter((parameter) => parameter.parameterId > 0)
    .map((parameter) => ({
      id: parameter.id ?? undefined,
      parameterId: parameter.parameterId,
      reportParameterName: parameter.reportParameterName?.trim() || undefined
    }))
    .sort((left, right) => left.parameterId - right.parameterId);
}

function normalizeCoreReportDraftForm(form: UpsertReportFormInput) {
  return {
    useReport: form.useReport ?? false,
    description: form.description?.trim() ?? ''
  };
}

function normalizeCustomReportDraftForm(form: UpsertReportFormInput) {
  return {
    reportName: form.reportName.trim(),
    reportType: form.reportType,
    reportSubType: form.reportSubType?.trim() ?? '',
    reportCategory: form.reportCategory ?? '',
    description: form.description?.trim() ?? '',
    useReport: form.useReport ?? false,
    reportSql: form.reportSql?.trim() ?? ''
  };
}

export function reportDraftHasUnsavedChanges(
  current: ReportWizardDraft,
  baseline: ReportWizardDraft,
  options: { coreReport: boolean }
): boolean {
  if (options.coreReport) {
    return (
      JSON.stringify(normalizeCoreReportDraftForm(current.form)) !==
      JSON.stringify(normalizeCoreReportDraftForm(baseline.form))
    );
  }

  const currentSnapshot = {
    ...normalizeCustomReportDraftForm(current.form),
    reportParameters: normalizeReportParameters(current.parameters)
  };
  const baselineSnapshot = {
    ...normalizeCustomReportDraftForm(baseline.form),
    reportParameters: normalizeReportParameters(baseline.parameters)
  };
  return JSON.stringify(currentSnapshot) !== JSON.stringify(baselineSnapshot);
}

function errorsForFields(
  parsed: ReturnType<typeof validateUpsertReportForm>,
  fields: readonly string[]
): StepErrors {
  if (parsed.success) {
    return {};
  }
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || 'form';
    const rootKey = issue.path[0]?.toString() ?? key;
    if (fields.includes(rootKey) || fields.includes(key)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateReportStep(stepId: string, draft: ReportWizardDraft): StepErrors {
  if (stepId === 'review' || stepId === 'parameters') {
    return {};
  }

  if (stepId === 'settings') {
    const parsed = validateUpdateCoreReportForm({
      useReport: draft.form.useReport,
      description: draft.form.description
    });
    if (parsed.success) {
      return {};
    }
    const errors: StepErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'form';
      errors[key] = issue.message;
    }
    return errors;
  }

  if (stepId === 'query' && isSqlDisabledForReportType(draft.form.reportType)) {
    return {};
  }

  const fields = CUSTOM_STEP_FIELDS[stepId] ?? [];
  return errorsForFields(validateUpsertReportForm(draftToPayload(draft)), fields);
}

export function validateReportDraft(draft: ReportWizardDraft): StepErrors {
  const parsed = validateUpsertReportForm(draftToPayload(draft));
  if (parsed.success) {
    return {};
  }
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || 'form';
    errors[key] = issue.message;
  }
  return errors;
}

export function validateCoreReportDraft(draft: ReportWizardDraft): StepErrors {
  const parsed = validateUpdateCoreReportForm({
    useReport: draft.form.useReport,
    description: draft.form.description
  });
  if (parsed.success) {
    return {};
  }
  const errors: StepErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || 'form';
    errors[key] = issue.message;
  }
  return errors;
}

export function stepForField(fieldKey: string, showQueryStep: boolean): string {
  if (['reportName', 'reportType', 'reportSubType', 'reportCategory'].includes(fieldKey)) {
    return 'details';
  }
  if (fieldKey === 'reportSql') {
    return showQueryStep ? 'query' : 'details';
  }
  if (fieldKey.startsWith('reportParameters')) {
    return 'parameters';
  }
  return 'review';
}

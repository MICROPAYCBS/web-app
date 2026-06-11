'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DetailField,
  DetailFieldGrid,
  DetailSection
} from '@/components/composites';
import {
  formatReportCategory,
  isSqlDisabledForReportType,
  yesNoLabel
} from '@/lib/fineract/report-display';
import type { ReportStepProps } from '../types';

export function ReportPreviewStep({
  draft,
  submitError,
  mode,
  coreReport = false
}: {
  draft: ReportStepProps['draft'];
  submitError: string | null;
  mode: 'create' | 'edit';
  coreReport?: boolean;
}) {
  const { form, parameters } = draft;
  const configuredParameters = parameters.filter((parameter) => parameter.parameterId > 0);
  const showSql = !coreReport && !isSqlDisabledForReportType(form.reportType);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the report before {mode === 'create' ? 'creating' : 'saving'}.
      </p>

      {submitError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <DetailSection title="Basic details">
        <DetailFieldGrid columns={2}>
          {!coreReport ? (
            <>
              <DetailField label="Report name">{form.reportName || '—'}</DetailField>
              <DetailField label="Report type">{form.reportType || '—'}</DetailField>
              <DetailField label="Sub-type">{form.reportSubType?.trim() || '—'}</DetailField>
              <DetailField label="Category">{formatReportCategory(form.reportCategory)}</DetailField>
            </>
          ) : null}
          <DetailField label="User report">{yesNoLabel(form.useReport)}</DetailField>
          <DetailField label="Description">{form.description?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      {showSql ? (
        <DetailSection title="Query">
          <pre className="max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-xs whitespace-pre-wrap">
            {form.reportSql?.trim() || '—'}
          </pre>
        </DetailSection>
      ) : null}

      {!coreReport ? (
        <DetailSection title="Parameters">
          {configuredParameters.length ? (
            <div className="overflow-hidden rounded-md border border-border">
              <div className="grid grid-cols-2 gap-2 border-b border-border bg-muted/40 px-4 py-2 text-sm font-medium">
                <span>Parameter</span>
                <span>Name passed to report engine</span>
              </div>
              {configuredParameters.map((parameter, index) => (
                <div
                  key={`${parameter.parameterId}-${index}`}
                  className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0"
                >
                  <span>{parameter.parameterName}</span>
                  <span className="text-muted-foreground">
                    {parameter.reportParameterName?.trim() || '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No parameters configured.</p>
          )}
        </DetailSection>
      ) : null}
    </div>
  );
}

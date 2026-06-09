'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportDetail, FineractReportTemplate } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateUpsertReportForm,
  type UpsertReportFormInput
} from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createReportAction, updateReportAction } from '@/actions/reports';
import { TextField } from '@/components/composites/text-field';
import {
  ReportParametersTable,
  type ReportParameterRow
} from '@/components/system/report-parameters-table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  isSqlDisabledForReportType,
  isSubTypeEnabledForReportType,
  REPORT_CATEGORIES,
  toReportParameterRows
} from '@/lib/fineract/report-display';
import { cn } from '@/lib/utils';

function initialParameters(
  report: FineractReportDetail | undefined,
  template: FineractReportTemplate
): ReportParameterRow[] {
  if (!report) {
    return [];
  }
  return toReportParameterRows(report.reportParameters, template.allowedParameters);
}

export function ReportForm({
  mode,
  reportId,
  template,
  report
}: {
  mode: 'create' | 'edit';
  reportId?: number;
  template: FineractReportTemplate;
  report?: FineractReportDetail;
}) {
  const router = useRouter();
  const formId = useId();
  const coreReport = report?.coreReport === true;
  const allowedReportTypes =
    mode === 'edit' && report ? report.allowedReportTypes : template.allowedReportTypes;
  const allowedReportSubTypes =
    mode === 'edit' && report ? report.allowedReportSubTypes : template.allowedReportSubTypes;
  const allowedParameters =
    mode === 'edit' && report ? report.allowedParameters : template.allowedParameters;

  const [form, setForm] = useState<UpsertReportFormInput>(() => ({
    reportName: report?.reportName ?? '',
    reportType: report?.reportType ?? '',
    reportSubType: report?.reportSubType ?? '',
    reportCategory: (report?.reportCategory as UpsertReportFormInput['reportCategory']) ?? '',
    description: report?.description ?? '',
    useReport: report?.useReport ?? false,
    reportSql: report?.reportSql ?? '',
    reportParameters: []
  }));
  const [parameters, setParameters] = useState<ReportParameterRow[]>(() =>
    initialParameters(report, template)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sqlDisabled = coreReport || isSqlDisabledForReportType(form.reportType);
  const subTypeEnabled = !coreReport && isSubTypeEnabledForReportType(form.reportType);
  const fieldsLocked = coreReport;

  const cancelHref = useMemo(() => {
    if (mode === 'edit' && reportId != null) {
      return `/system/reports/${reportId}`;
    }
    return '/system/reports';
  }, [mode, reportId]);

  function patchForm(patch: Partial<UpsertReportFormInput>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleReportTypeChange(reportType: string) {
    const next: Partial<UpsertReportFormInput> = { reportType };
    if (!isSubTypeEnabledForReportType(reportType)) {
      next.reportSubType = '';
    }
    if (isSqlDisabledForReportType(reportType)) {
      next.reportSql = '';
    }
    patchForm(next);
  }

  function handleSubmit() {
    setSubmitError(null);
    const payload: UpsertReportFormInput = {
      ...form,
      reportParameters: parameters.map((parameter) => ({
        id: parameter.id,
        parameterId: parameter.parameterId,
        reportParameterName: parameter.reportParameterName
      }))
    };
    const parsed = validateUpsertReportForm(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createReportAction(parsed.data)
          : await updateReportAction(reportId as number, parsed.data);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }

      toast.success(mode === 'create' ? 'Report created.' : 'Report updated.');
      router.push(`/system/reports/${result.resourceId ?? reportId}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      <div className="space-y-2">
        <Link href={cancelHref} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-3')}>
          Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === 'create' ? 'Create report' : `Edit ${report?.reportName ?? 'report'}`}
        </h1>
        {coreReport ? (
          <p className="text-sm text-muted-foreground">
            Core reports only allow updating the user-report flag and description.
          </p>
        ) : null}
      </div>

      <form
        id={formId}
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            id={`${formId}-reportName`}
            label="Report name"
            value={form.reportName}
            onChange={(value) => patchForm({ reportName: value })}
            disabled={fieldsLocked || pending}
            error={fieldErrors.reportName}
            required
          />
          <div className="space-y-2">
            <Label htmlFor={`${formId}-reportType`}>Report type</Label>
            <Select
              value={form.reportType}
              onValueChange={(value) => value && handleReportTypeChange(value)}
              disabled={fieldsLocked || pending}
            >
              <SelectTrigger id={`${formId}-reportType`}>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {allowedReportTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.reportType ? (
              <p className="text-sm text-destructive">{fieldErrors.reportType}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-reportSubType`}>Report sub-type</Label>
            <Select
              value={form.reportSubType ?? ''}
              onValueChange={(value) => patchForm({ reportSubType: value ?? '' })}
              disabled={!subTypeEnabled || pending}
            >
              <SelectTrigger id={`${formId}-reportSubType`}>
                <SelectValue placeholder="Select sub-type" />
              </SelectTrigger>
              <SelectContent>
                {allowedReportSubTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.reportSubType ? (
              <p className="text-sm text-destructive">{fieldErrors.reportSubType}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-reportCategory`}>Category</Label>
            <Select
              value={form.reportCategory ?? ''}
              onValueChange={(value) =>
                patchForm({ reportCategory: (value ?? '') as UpsertReportFormInput['reportCategory'] })
              }
              disabled={fieldsLocked || pending}
            >
              <SelectTrigger id={`${formId}-reportCategory`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {REPORT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id={`${formId}-useReport`}
            checked={form.useReport}
            onCheckedChange={(checked) => patchForm({ useReport: checked === true })}
            disabled={pending}
          />
          <Label htmlFor={`${formId}-useReport`}>Show in user reports menu</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-description`}>Description</Label>
          <Textarea
            id={`${formId}-description`}
            value={form.description ?? ''}
            onChange={(event) => patchForm({ description: event.target.value })}
            disabled={pending}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-reportSql`}>Report SQL</Label>
          <Textarea
            id={`${formId}-reportSql`}
            value={form.reportSql ?? ''}
            onChange={(event) => patchForm({ reportSql: event.target.value })}
            disabled={sqlDisabled || pending}
            rows={8}
            className="font-mono text-sm"
          />
          {fieldErrors.reportSql ? (
            <p className="text-sm text-destructive">{fieldErrors.reportSql}</p>
          ) : null}
        </div>

        {!coreReport ? (
          <ReportParametersTable
            parameters={parameters}
            allowedParameters={allowedParameters}
            disabled={pending}
            onChange={setParameters}
          />
        ) : null}

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {mode === 'create' ? 'Create report' : 'Save changes'}
          </Button>
          <Link href={cancelHref} className={cn(buttonVariants({ variant: 'outline' }))}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

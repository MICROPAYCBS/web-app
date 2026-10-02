'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractReportDetail,
  FineractReportRunParameter,
  FineractReportRunResult
} from '@mifos/api-client';
import { Filter, Pencil, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { fetchReportParameterMetadataAction, runReportAction } from '@/actions/report-run';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { FinancialStatementPreview } from '@/components/reports/financial-statement-preview';
import { ReportParameterSheet } from '@/components/reports/report-parameter-sheet';
import { ReportResultTable } from '@/components/reports/report-result-table';
import { Button, buttonVariants } from '@/components/ui/button';
import { buildFinancialStatement } from '@/lib/fineract/financial-statement';
import type { FinancialReportSlug } from '@/lib/fineract/financial-reports';
import {
  isTabularReportType,
  mergeReportRunParameters
} from '@/lib/fineract/report-run-display';
import { toastFineractError } from '@/lib/toast-fineract-error';
import { cn } from '@/lib/utils';

export function ReportRunPageContent({
  report,
  canEdit = false,
  backHref = '/reports',
  backLabel = 'Back to reports',
  statementSlug,
  organisationName
}: {
  report: FineractReportDetail;
  canEdit?: boolean;
  /** Override catalog back link (e.g. financial-report entry points). */
  backHref?: string;
  backLabel?: string;
  /** When set, a successful run renders a statement preview instead of the generic grid. */
  statementSlug?: FinancialReportSlug;
  organisationName?: string;
}) {
  const [parameters, setParameters] = useState<FineractReportRunParameter[]>(() =>
    mergeReportRunParameters([], report)
  );
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [result, setResult] = useState<FineractReportRunResult | null>(null);
  const [runValues, setRunValues] = useState<Record<string, string>>({});
  const [runDisplayValues, setRunDisplayValues] = useState<Record<string, string>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const tabular = isTabularReportType(report.reportType);
  const reportDescription = report.description?.trim();

  useEffect(() => {
    let cancelled = false;
    setMetadataLoading(true);
    void (async () => {
      const metadataResult = await fetchReportParameterMetadataAction(report.reportName);
      if (cancelled) {
        return;
      }
      if (!metadataResult.ok) {
        toastFineractError(metadataResult.message);
        setParameters(mergeReportRunParameters([], report));
        setMetadataLoading(false);
        setSheetOpen(true);
        return;
      }
      const merged = mergeReportRunParameters(metadataResult.data, report);
      setParameters(merged);
      setMetadataLoading(false);
      setSheetOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [report.id, report.reportName]);

  const parameterCountLabel = useMemo(() => {
    if (metadataLoading) {
      return 'Loading parameters…';
    }
    return parameters.length
      ? `${parameters.length} parameter${parameters.length === 1 ? '' : 's'}`
      : 'No parameters';
  }, [metadataLoading, parameters.length]);

  const statementResult = useMemo(() => {
    if (!statementSlug || !result) {
      return null;
    }
    return buildFinancialStatement({
      slug: statementSlug,
      result,
      organisationName,
      parameters,
      values: runValues,
      displayValues: runDisplayValues
    });
  }, [statementSlug, result, organisationName, parameters, runValues, runDisplayValues]);

  const showStatement = statementResult?.ok === true;

  function handleRun(values: Record<string, string>, displayValues?: Record<string, string>) {
    startTransition(async () => {
      const runResult = await runReportAction({
        reportName: report.reportName,
        parameters: values
      });
      if (!runResult.ok) {
        toastFineractError(runResult.message);
        return;
      }
      setRunValues(values);
      setRunDisplayValues(displayValues ?? {});
      setResult(runResult.data);
      toast.success('Report completed.');
    });
  }

  return (
    <ListPage
      className={showStatement ? 'financial-statement-page' : undefined}
      headerClassName={showStatement ? 'print:hidden' : undefined}
      backLink={<DetailBackLink href={backHref} label={backLabel} />}
      title={report.reportName}
      meta={`${report.reportType}${report.reportSubType ? ` · ${report.reportSubType}` : ''}`}
      titleHint={reportDescription}
      titleHintAriaLabel="About this report"
      actions={
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Link
              href={`/system/reports/${report.id}/edit`}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              <Pencil className="mr-2 size-4" />
              Edit report
            </Link>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => setSheetOpen(true)}
            disabled={metadataLoading || pending}
          >
            <Filter className="mr-2 size-4" />
            Parameters
          </Button>
          {result ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(true)}
              disabled={pending}
            >
              <RefreshCw className="mr-2 size-4" />
              Run again
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <p className={cn('text-sm text-muted-foreground', showStatement && 'print:hidden')}>
          {parameterCountLabel}
        </p>

        {!tabular ? (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            {report.reportType} reports are not supported in the browser yet. Table and SMS reports
            can be run here; chart and PDF report types will follow in a later update.
          </div>
        ) : pending ? (
          <ReportResultTable result={result} reportName={report.reportName} loading />
        ) : statementResult?.ok ? (
          <FinancialStatementPreview statement={statementResult.statement} />
        ) : (
          <ReportResultTable result={result} reportName={report.reportName} />
        )}
      </div>

      <ReportParameterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        reportName={report.reportName}
        parameters={parameters}
        pending={pending}
        onSubmit={handleRun}
      />
    </ListPage>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Can } from '@mifos/auth';
import { Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createGlAccountAction } from '@/actions/gl-accounts';
import { ChartOfAccountsImportReview } from '@/components/accounting/chart-of-accounts/chart-of-accounts-import-review';
import { TitleWithHint } from '@/components/composites/field-hint-tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isPendingCheckerActionResult } from '@mifos/validation';
import {
  analyzeChartOfAccountsImportRows,
  CHART_OF_ACCOUNTS_IMPORT_NAME,
  CHART_OF_ACCOUNTS_IMPORT_TEMPLATE_HINT,
  prepareChartOfAccountsImportRows,
  resolveChartOfAccountsImportParentId,
  type ChartOfAccountsImportAnalysis,
  type ChartOfAccountsImportLookupAccount,
  type ChartOfAccountsImportPreparedRow,
  type ChartOfAccountsImportRowProgress
} from '@/lib/accounting/chart-of-accounts-import';
import { parseChartOfAccountsImportFile } from '@/lib/accounting/chart-of-accounts-workbook';
import { bulkImportTemplateApiPath } from '@/lib/fineract/bulk-import-paths';

export function ChartOfAccountsImportPanel({
  existingAccounts,
  canDownload,
  canCreate
}: {
  existingAccounts: ChartOfAccountsImportLookupAccount[];
  canDownload: boolean;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ChartOfAccountsImportAnalysis | null>(null);
  const [preparedRows, setPreparedRows] = useState<ChartOfAccountsImportPreparedRow[]>([]);
  const [progressByRow, setProgressByRow] = useState<Record<number, ChartOfAccountsImportRowProgress>>(
    {}
  );
  const [importing, setImporting] = useState(false);
  const [analyzing, startAnalyzeTransition] = useTransition();

  const busy = analyzing || importing;
  const importFinished = useMemo(() => {
    if (!importing && Object.keys(progressByRow).length === 0) {
      return false;
    }
    if (!analysis) {
      return false;
    }
    const tracked = Object.keys(progressByRow).length;
    return tracked > 0 && tracked === analysis.rowCount && !importing;
  }, [analysis, importing, progressByRow]);

  function handleDownloadTemplate() {
    window.open(bulkImportTemplateApiPath(CHART_OF_ACCOUNTS_IMPORT_NAME), '_blank');
  }

  function clearReview() {
    setAnalysis(null);
    setPreparedRows([]);
    setProgressByRow({});
    setImporting(false);
    setSelectedFile(null);
    setFileInputKey((current) => current + 1);
  }

  function handleAnalyze() {
    if (!selectedFile) {
      return;
    }

    startAnalyzeTransition(async () => {
      const parsed = await parseChartOfAccountsImportFile(selectedFile);
      if (!parsed.ok) {
        setAnalysis(null);
        setPreparedRows([]);
        setProgressByRow({});
        toast.error(parsed.message);
        return;
      }

      const nextAnalysis = analyzeChartOfAccountsImportRows(parsed.rows, existingAccounts);
      setAnalysis(nextAnalysis);
      setProgressByRow({});

      if (!nextAnalysis.canCreate) {
        setPreparedRows([]);
        toast.message('File analyzed with errors. Fix the highlighted rows and analyze again.');
        return;
      }

      const prepared = prepareChartOfAccountsImportRows(nextAnalysis, existingAccounts);
      if (!prepared.ok) {
        setPreparedRows([]);
        toast.error(prepared.message);
        return;
      }

      setPreparedRows(prepared.rows);
      toast.success('File analyzed. Review the rows below, then create accounts.');
    });
  }

  async function handleCreateAccounts() {
    if (!analysis?.canCreate || preparedRows.length === 0) {
      return;
    }

    setImporting(true);
    const createdByGlCode = new Map<string, number>();
    const nextProgress: Record<number, ChartOfAccountsImportRowProgress> = {};
    for (const row of preparedRows) {
      nextProgress[row.rowNumber] = { status: 'pending' };
    }
    setProgressByRow(nextProgress);

    let successCount = 0;
    let failureCount = 0;

    for (const row of preparedRows) {
      setProgressByRow((current) => ({
        ...current,
        [row.rowNumber]: { status: 'creating' }
      }));

      const parentId = resolveChartOfAccountsImportParentId(row, createdByGlCode, existingAccounts);
      const input = { ...row.input, parentId };

      try {
        const result = await createGlAccountAction(input);
        if (!result.ok) {
          failureCount += 1;
          const message =
            result.fieldErrors && Object.keys(result.fieldErrors).length > 0
              ? Object.values(result.fieldErrors).join(' ')
              : result.message;
          setProgressByRow((current) => ({
            ...current,
            [row.rowNumber]: { status: 'failed', message }
          }));
          continue;
        }

        successCount += 1;
        if (result.resourceId != null) {
          createdByGlCode.set(row.input.glCode, result.resourceId);
        }

        setProgressByRow((current) => ({
          ...current,
          [row.rowNumber]: {
            status: isPendingCheckerActionResult(result) ? 'pending_approval' : 'success',
            resourceId: result.resourceId
          }
        }));
      } catch (error) {
        failureCount += 1;
        setProgressByRow((current) => ({
          ...current,
          [row.rowNumber]: {
            status: 'failed',
            message: error instanceof Error ? error.message : 'Failed to create account.'
          }
        }));
      }
    }

    setImporting(false);
    router.refresh();

    if (failureCount === 0) {
      toast.success(
        successCount === 1 ? 'Created 1 account.' : `Created ${successCount} accounts.`
      );
    } else if (successCount === 0) {
      toast.error('No accounts were created. See the row details below.');
    } else {
      toast.message(`Created ${successCount} of ${successCount + failureCount} accounts.`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-border p-4">
          <TitleWithHint
            hint={CHART_OF_ACCOUNTS_IMPORT_TEMPLATE_HINT}
            hintAriaLabel="Chart of accounts import template help"
          >
            <h2 className="text-base font-medium">Import template</h2>
          </TitleWithHint>
          <p className="text-sm text-muted-foreground">
            Download the template, fill in your accounts, then analyze the file here. Accounts are
            created one by one through the chart of accounts API so you can see progress and errors
            immediately.
          </p>
          <Can permission="READ_CLIENT">
            {canDownload ? (
              <Button type="button" onClick={handleDownloadTemplate} disabled={busy}>
                <Download className="mr-2 size-4" />
                Download template
              </Button>
            ) : null}
          </Can>
        </section>

        <section className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-base font-medium">Analyze file</h2>
          <div className="space-y-2">
            <label htmlFor="coa-import-file" className="text-sm font-medium">
              Select Excel file
            </label>
            <Input
              key={fileInputKey}
              id="coa-import-file"
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={busy}
              onChange={(event) => {
                setSelectedFile(event.target.files?.[0] ?? null);
                setAnalysis(null);
                setPreparedRows([]);
                setProgressByRow({});
              }}
            />
            <p className="text-sm text-muted-foreground">.xlsx and .xls are both accepted.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!selectedFile || busy} onClick={handleAnalyze}>
              <Upload className="mr-2 size-4" />
              {analyzing ? 'Analyzing…' : 'Analyze file'}
            </Button>
            {analysis ? (
              <Button type="button" variant="outline" disabled={busy} onClick={clearReview}>
                Clear review
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      {analysis ? (
        <ChartOfAccountsImportReview
          analysis={analysis}
          progressByRow={progressByRow}
          importing={importing}
        />
      ) : null}

      {analysis ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={clearReview}>
            {importFinished ? 'Import another file' : 'Choose another file'}
          </Button>
          {canCreate ? (
            <Button
              type="button"
              disabled={!analysis.canCreate || preparedRows.length === 0 || busy || importFinished}
              onClick={() => {
                void handleCreateAccounts();
              }}
            >
              {importing ? 'Creating accounts…' : 'Create accounts'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

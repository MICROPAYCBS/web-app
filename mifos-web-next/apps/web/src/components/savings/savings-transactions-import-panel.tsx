'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { isPendingCheckerActionResult } from '@mifos/validation';
import { Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  analyzeSavingsTransactionsImportAction,
  postSavingsTransactionImportRowAction
} from '@/actions/savings-transactions-import';
import { SavingsTransactionsImportReview } from '@/components/savings/savings-transactions-import-review';
import { TitleWithHint } from '@/components/composites/field-hint-tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SAVINGS_TRANSACTIONS_IMPORT_TEMPLATE_HINT,
  type SavingsTransactionsImportAnalysis,
  type SavingsTransactionsImportPreparedRow,
  type SavingsTransactionsImportRowProgress
} from '@/lib/savings/savings-transactions-import';
import { parseSavingsTransactionsImportFile } from '@/lib/savings/savings-transactions-import-workbook';

const TEMPLATE_API_PATH = '/api/savings/import/template';
const LEGACY_BULK_IMPORT_HREF = '/organization/bulk-import/Savings%20Transactions';

export function SavingsTransactionsImportPanel({ canPost }: { canPost: boolean }) {
  const router = useRouter();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<SavingsTransactionsImportAnalysis | null>(null);
  const [preparedRows, setPreparedRows] = useState<SavingsTransactionsImportPreparedRow[]>([]);
  const [progressByRow, setProgressByRow] = useState<
    Record<number, SavingsTransactionsImportRowProgress>
  >({});
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
    window.open(TEMPLATE_API_PATH, '_blank');
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
      const parsed = await parseSavingsTransactionsImportFile(selectedFile);
      if (!parsed.ok) {
        setAnalysis(null);
        setPreparedRows([]);
        setProgressByRow({});
        toast.error(parsed.message);
        return;
      }

      const result = await analyzeSavingsTransactionsImportAction(parsed.rows);
      if (!result.ok) {
        setAnalysis(null);
        setPreparedRows([]);
        setProgressByRow({});
        toast.error(result.message);
        return;
      }

      setAnalysis(result.analysis);
      setPreparedRows(result.preparedRows);
      setProgressByRow({});

      if (!result.analysis.canPost) {
        toast.message('File analyzed with errors. Fix the highlighted rows and analyze again.');
        return;
      }

      toast.success('File analyzed. Review the rows below, then post transactions.');
    });
  }

  async function handlePostTransactions() {
    if (!analysis?.canPost || preparedRows.length === 0) {
      return;
    }

    setImporting(true);
    const nextProgress: Record<number, SavingsTransactionsImportRowProgress> = {};
    for (const row of preparedRows) {
      nextProgress[row.rowNumber] = { status: 'pending' };
    }
    setProgressByRow(nextProgress);

    let successCount = 0;
    let failureCount = 0;

    for (const row of preparedRows) {
      setProgressByRow((current) => ({
        ...current,
        [row.rowNumber]: { status: 'posting' }
      }));

      try {
        const result = await postSavingsTransactionImportRowAction(row);
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
            message: error instanceof Error ? error.message : 'Failed to post transaction.'
          }
        }));
      }
    }

    setImporting(false);
    router.refresh();

    if (failureCount === 0) {
      toast.success(
        successCount === 1
          ? 'Posted 1 transaction.'
          : `Posted ${successCount} transactions.`
      );
    } else if (successCount === 0) {
      toast.error('No transactions were posted. See the row details below.');
    } else {
      toast.message(`Posted ${successCount} of ${successCount + failureCount} transactions.`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-border p-4">
          <TitleWithHint
            hint={SAVINGS_TRANSACTIONS_IMPORT_TEMPLATE_HINT}
            hintAriaLabel="Savings transaction import template help"
          >
            <h2 className="text-base font-medium">Import template</h2>
          </TitleWithHint>
          <p className="text-sm text-muted-foreground">
            Download the template, fill one deposit or withdrawal per row, then analyze the file
            here. Transactions are posted one by one using the same checks as Deposit and
            Withdrawal on a savings account.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={handleDownloadTemplate}
          >
            <Download className="mr-2 size-4" />
            Download template
          </Button>
        </section>

        <section className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-base font-medium">Analyze file</h2>
          <div className="space-y-2">
            <Label htmlFor="savings-transactions-import-file">Excel file</Label>
            <Input
              key={fileInputKey}
              id="savings-transactions-import-file"
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
        <SavingsTransactionsImportReview
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
          {canPost ? (
            <Button
              type="button"
              disabled={!analysis.canPost || preparedRows.length === 0 || busy || importFinished}
              onClick={() => {
                void handlePostTransactions();
              }}
            >
              {importing ? 'Posting transactions…' : 'Post transactions'}
            </Button>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Platform Excel upload is still available under{' '}
        <Link href={LEGACY_BULK_IMPORT_HREF} className="underline underline-offset-4">
          Organization → Bulk import → Savings transactions
        </Link>
        .
      </p>
    </div>
  );
}

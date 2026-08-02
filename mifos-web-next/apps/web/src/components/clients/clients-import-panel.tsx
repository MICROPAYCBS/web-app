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
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createClientAction, saveClientDraftAction } from '@/actions/clients';
import {
  ClientsImportReview,
  type ClientsImportReviewAnalysis
} from '@/components/clients/clients-import-review';
import { TitleWithHint } from '@/components/composites/field-hint-tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  analyzeClientsImportRows,
  CLIENTS_IMPORT_TEMPLATE_HINT,
  prepareClientsImportRows,
  type ClientsImportLookups,
  type ClientsImportPreparedRow,
  type ClientsImportRowProgress
} from '@/lib/clients/clients-import';
import {
  analyzeClientsLegacyImportRows,
  CLIENTS_LEGACY_IMPORT_TEMPLATE_HINT,
  prepareClientsLegacyImportRows,
  type ClientsLegacyImportPreparedRow
} from '@/lib/clients/clients-import-legacy';
import {
  parseClientsImportFile,
  parseClientsLegacyImportFile
} from '@/lib/clients/clients-import-workbook';

const TEMPLATE_API_PATH = '/api/clients/import/template';

export type ClientsImportMode = 'micropay' | 'legacy';

type PreparedRow = ClientsImportPreparedRow | ClientsLegacyImportPreparedRow;

export function ClientsImportPanel({
  lookups,
  defaultOfficeId,
  canDownload,
  canCreate
}: {
  lookups: ClientsImportLookups;
  defaultOfficeId?: number;
  canDownload: boolean;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ClientsImportMode>('micropay');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ClientsImportReviewAnalysis | null>(null);
  const [preparedRows, setPreparedRows] = useState<PreparedRow[]>([]);
  const [progressByRow, setProgressByRow] = useState<Record<number, ClientsImportRowProgress>>({});
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

  const templateHint =
    mode === 'legacy' ? CLIENTS_LEGACY_IMPORT_TEMPLATE_HINT : CLIENTS_IMPORT_TEMPLATE_HINT;

  function handleDownloadTemplate() {
    const path =
      mode === 'legacy' ? `${TEMPLATE_API_PATH}?mode=legacy` : TEMPLATE_API_PATH;
    window.open(path, '_blank');
  }

  function clearReview() {
    setAnalysis(null);
    setPreparedRows([]);
    setProgressByRow({});
    setImporting(false);
    setSelectedFile(null);
    setFileInputKey((current) => current + 1);
  }

  function handleModeChange(nextMode: ClientsImportMode) {
    if (nextMode === mode) {
      return;
    }
    setMode(nextMode);
    clearReview();
  }

  function handleAnalyze() {
    if (!selectedFile) {
      return;
    }

    startAnalyzeTransition(async () => {
      if (mode === 'legacy') {
        const parsed = await parseClientsLegacyImportFile(selectedFile);
        if (!parsed.ok) {
          setAnalysis(null);
          setPreparedRows([]);
          setProgressByRow({});
          toast.error(parsed.message);
          return;
        }

        const nextAnalysis = analyzeClientsLegacyImportRows(parsed.rows, lookups);
        setAnalysis(nextAnalysis);
        setProgressByRow({});

        if (!nextAnalysis.canCreate) {
          setPreparedRows([]);
          toast.message('File analyzed with errors. Fix the highlighted rows and analyze again.');
          return;
        }

        if (!defaultOfficeId) {
          setPreparedRows([]);
          toast.error('Your session has no branch office to assign imported customers to.');
          return;
        }

        const prepared = prepareClientsLegacyImportRows(nextAnalysis, lookups, defaultOfficeId);
        if (!prepared.ok) {
          setPreparedRows([]);
          toast.error(prepared.message);
          return;
        }

        setPreparedRows(prepared.rows);
        toast.success('File analyzed. Review the rows below, then create draft customers.');
        return;
      }

      const parsed = await parseClientsImportFile(selectedFile);
      if (!parsed.ok) {
        setAnalysis(null);
        setPreparedRows([]);
        setProgressByRow({});
        toast.error(parsed.message);
        return;
      }

      const nextAnalysis = analyzeClientsImportRows(parsed.rows, lookups);
      setAnalysis(nextAnalysis);
      setProgressByRow({});

      if (!nextAnalysis.canCreate) {
        setPreparedRows([]);
        toast.message('File analyzed with errors. Fix the highlighted rows and analyze again.');
        return;
      }

      const prepared = prepareClientsImportRows(nextAnalysis, lookups);
      if (!prepared.ok) {
        setPreparedRows([]);
        toast.error(prepared.message);
        return;
      }

      setPreparedRows(prepared.rows);
      toast.success('File analyzed. Review the rows below, then create customers.');
    });
  }

  async function handleCreateCustomers() {
    if (!analysis?.canCreate || preparedRows.length === 0) {
      return;
    }

    setImporting(true);
    const nextProgress: Record<number, ClientsImportRowProgress> = {};
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

      try {
        const result =
          mode === 'legacy'
            ? await saveClientDraftAction(row.input)
            : await createClientAction(row.input);
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
            resourceId: result.clientId
          }
        }));
      } catch (error) {
        failureCount += 1;
        setProgressByRow((current) => ({
          ...current,
          [row.rowNumber]: {
            status: 'failed',
            message: error instanceof Error ? error.message : 'Failed to create customer.'
          }
        }));
      }
    }

    setImporting(false);
    router.refresh();

    if (failureCount === 0) {
      toast.success(
        successCount === 1
          ? mode === 'legacy'
            ? 'Created 1 draft customer.'
            : 'Created 1 customer.'
          : mode === 'legacy'
            ? `Created ${successCount} draft customers.`
            : `Created ${successCount} customers.`
      );
    } else if (successCount === 0) {
      toast.error('No customers were created. See the row details below.');
    } else {
      toast.message(`Created ${successCount} of ${successCount + failureCount} customers.`);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-base font-medium">Import type</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-[:checked]:border-primary">
            <input
              type="radio"
              name="clients-import-mode"
              className="mt-1"
              checked={mode === 'micropay'}
              disabled={busy}
              onChange={() => handleModeChange('micropay')}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">Micropay template</span>
              <span className="block text-sm text-muted-foreground">
                Full person create fields (customer class, officer, nationality, ID type, next of
                kin structure).
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-[:checked]:border-primary">
            <input
              type="radio"
              name="clients-import-mode"
              className="mt-1"
              checked={mode === 'legacy'}
              disabled={busy}
              onChange={() => handleModeChange('legacy')}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">Legacy template</span>
              <span className="block text-sm text-muted-foreground">
                Older spreadsheet layout. Only first and last name are required; creates draft
                customers without Micropay-required fields.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-border p-4">
          <TitleWithHint hint={templateHint} hintAriaLabel="Customer import template help">
            <h2 className="text-base font-medium">Import template</h2>
          </TitleWithHint>
          <p className="text-sm text-muted-foreground">
            {mode === 'legacy'
              ? 'Download the legacy template (or use an existing legacy file), analyze it, then create draft customers with live progress.'
              : 'Download the template, fill in person customers, then analyze the file here. Customers are created one by one using the same checks as New customer.'}
          </p>
          {canDownload ? (
            <Button type="button" onClick={handleDownloadTemplate} disabled={busy}>
              <Download className="mr-2 size-4" />
              Download {mode === 'legacy' ? 'legacy ' : ''}template
            </Button>
          ) : null}
        </section>

        <section className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-base font-medium">Analyze file</h2>
          <div className="space-y-2">
            <Label htmlFor="clients-import-file">Select Excel file</Label>
            <Input
              key={fileInputKey}
              id="clients-import-file"
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
        <ClientsImportReview
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
                void handleCreateCustomers();
              }}
            >
              {importing
                ? mode === 'legacy'
                  ? 'Creating drafts…'
                  : 'Creating customers…'
                : mode === 'legacy'
                  ? 'Create draft customers'
                  : 'Create customers'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

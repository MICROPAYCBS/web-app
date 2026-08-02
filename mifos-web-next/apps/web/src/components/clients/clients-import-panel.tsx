'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BulkImportStaffOption } from '@mifos/api-client';
import { isPendingCheckerActionResult } from '@mifos/validation';
import { Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createClientAction,
  createLegacyImportClientAction,
  loadClientsImportStaffAction
} from '@/actions/clients';
import {
  ClientsImportReview,
  type ClientsImportReviewAnalysis
} from '@/components/clients/clients-import-review';
import { TitleWithHint } from '@/components/composites/field-hint-tooltip';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastFineractError } from '@/lib/command-outcome-toast';
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
  type ClientsLegacyImportLegalForm,
  type ClientsLegacyImportPreparedRow
} from '@/lib/clients/clients-import-legacy';
import {
  parseClientsImportFile,
  parseClientsLegacyImportFile
} from '@/lib/clients/clients-import-workbook';
import { resolveClientLegalFormTypeFromSelection } from '@/lib/fineract/bulk-import-display';
import { toSelectOptions } from '@/lib/form/select-options';

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
  const [legacyOfficeId, setLegacyOfficeId] = useState(
    defaultOfficeId != null ? String(defaultOfficeId) : ''
  );
  const [legacyStaffId, setLegacyStaffId] = useState('');
  const [legacyLegalForm, setLegacyLegalForm] = useState<ClientsLegacyImportLegalForm>('Person');
  const [legacySavingsProductId, setLegacySavingsProductId] = useState('');
  const [staffOptions, setStaffOptions] = useState<BulkImportStaffOption[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ClientsImportReviewAnalysis | null>(null);
  const [preparedRows, setPreparedRows] = useState<PreparedRow[]>([]);
  const [progressByRow, setProgressByRow] = useState<Record<number, ClientsImportRowProgress>>({});
  const [importing, setImporting] = useState(false);
  const [analyzing, startAnalyzeTransition] = useTransition();
  const [loadingStaff, startStaffTransition] = useTransition();

  const busy = analyzing || importing || loadingStaff;
  const branchOptions = useMemo(() => toSelectOptions(lookups.offices), [lookups.offices]);
  const staffSelectOptions = useMemo(() => toSelectOptions(staffOptions), [staffOptions]);
  const savingsProductOptions = useMemo(
    () => toSelectOptions(lookups.savingProducts),
    [lookups.savingProducts]
  );
  const hasLegacyBranch = Boolean(legacyOfficeId);
  const hasLegacyLegalForm = Boolean(legacyLegalForm);
  const selectedLegacyOfficeId = Number(legacyOfficeId);
  const selectedLegacySavingsProductId = Number(legacySavingsProductId);
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

  function handleLegacyOfficeChange(officeId: string) {
    setLegacyOfficeId(officeId);
    setLegacyStaffId('');
    setStaffOptions([]);
    setAnalysis(null);
    setPreparedRows([]);
    setProgressByRow({});
    if (!officeId) {
      return;
    }
    startStaffTransition(async () => {
      const result = await loadClientsImportStaffAction(officeId);
      if (!result.ok) {
        toastFineractError(result.message);
        return;
      }
      setStaffOptions(result.data);
    });
  }

  function handleDownloadTemplate() {
    if (mode === 'legacy') {
      if (!hasLegacyBranch) {
        toast.error('Select a branch before downloading the legacy template.');
        return;
      }
      const legalFormType = resolveClientLegalFormTypeFromSelection(legacyLegalForm);
      if (!legalFormType) {
        toast.error('Select a profile type before downloading the legacy template.');
        return;
      }
      const params = new URLSearchParams({
        mode: 'legacy',
        officeId: legacyOfficeId,
        legalFormType
      });
      if (legacyStaffId) {
        params.set('staffId', legacyStaffId);
      }
      window.open(`${TEMPLATE_API_PATH}?${params.toString()}`, '_blank');
      return;
    }
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
        if (!hasLegacyBranch || !Number.isInteger(selectedLegacyOfficeId)) {
          toast.error('Select a branch before analyzing a legacy import file.');
          return;
        }
        if (!hasLegacyLegalForm) {
          toast.error('Select a profile type before analyzing a legacy import file.');
          return;
        }

        const parsed = await parseClientsLegacyImportFile(selectedFile, {
          legalForm: legacyLegalForm
        });
        if (!parsed.ok) {
          setAnalysis(null);
          setPreparedRows([]);
          setProgressByRow({});
          toast.error(parsed.message);
          return;
        }

        const nextAnalysis = analyzeClientsLegacyImportRows(parsed.rows, lookups, {
          selectedOfficeId: selectedLegacyOfficeId,
          legalForm: legacyLegalForm
        });
        setAnalysis(nextAnalysis);
        setProgressByRow({});

        if (!nextAnalysis.canCreate) {
          setPreparedRows([]);
          toast.message('File analyzed with errors. Fix the highlighted rows and analyze again.');
          return;
        }

        const prepared = prepareClientsLegacyImportRows(nextAnalysis, lookups, {
          selectedOfficeId: selectedLegacyOfficeId,
          legalForm: legacyLegalForm,
          savingsProductId:
            Number.isInteger(selectedLegacySavingsProductId) && selectedLegacySavingsProductId > 0
              ? selectedLegacySavingsProductId
              : undefined
        });
        if (!prepared.ok) {
          setPreparedRows([]);
          toast.error(prepared.message);
          return;
        }

        setPreparedRows(prepared.rows);
        toast.success('File analyzed. Review the rows below, then create customers.');
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
            ? await createLegacyImportClientAction(row.input)
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
          ? 'Created 1 customer.'
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
                Guided analyze and create with Micropay-required customer fields.
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
                Platform Customers Excel (branch-prefilled). Analyze and create active customers with
                live progress — no bulk import job.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-border p-4">
          <TitleWithHint hint={templateHint} hintAriaLabel="Customer import template help">
            <h2 className="text-base font-medium">
              {mode === 'legacy' ? 'Legacy template' : 'Import template'}
            </h2>
          </TitleWithHint>
          <p className="text-sm text-muted-foreground">
            {mode === 'legacy'
              ? 'Select branch, profile type, and optionally staff and a savings product. Download the platform template, fill it, then analyze here.'
              : 'Download the template, fill in person customers, then analyze the file here. Customers are created one by one using the same checks as New customer.'}
          </p>
          {mode === 'legacy' ? (
            <>
              <SelectField
                id="clients-import-legacy-branch"
                label="Branch"
                required
                value={legacyOfficeId || undefined}
                onValueChange={(value) => handleLegacyOfficeChange(value ?? '')}
                options={branchOptions}
                placeholder="Select branch"
                disabled={busy}
              />
              <SelectField
                id="clients-import-legacy-staff"
                label="Staff"
                optional
                value={legacyStaffId || undefined}
                onValueChange={(value) => setLegacyStaffId(value ?? '')}
                options={staffSelectOptions}
                placeholder="Select staff"
                disabled={!hasLegacyBranch || busy}
              />
              <SelectField
                id="clients-import-legacy-legal-form"
                label="Profile type"
                required
                value={legacyLegalForm || undefined}
                onValueChange={(value) => {
                  const next = value === 'Entity' ? 'Entity' : 'Person';
                  setLegacyLegalForm(next);
                  setAnalysis(null);
                  setPreparedRows([]);
                  setProgressByRow({});
                }}
                options={[
                  { value: 'Person', label: 'Person' },
                  { value: 'Entity', label: 'Entity' }
                ]}
                disabled={busy}
              />
              <SelectField
                id="clients-import-legacy-savings-product"
                label="Savings product"
                optional
                value={legacySavingsProductId || undefined}
                onValueChange={(value) => {
                  setLegacySavingsProductId(value ?? '');
                  setAnalysis(null);
                  setPreparedRows([]);
                  setProgressByRow({});
                }}
                options={savingsProductOptions}
                placeholder="Select savings product"
                disabled={busy}
              />
            </>
          ) : null}
          {canDownload ? (
            <Button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={
                busy || (mode === 'legacy' && (!hasLegacyBranch || !hasLegacyLegalForm))
              }
            >
              <Download className="mr-2 size-4" />
              Download template
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
            <Button
              type="button"
              disabled={
                !selectedFile ||
                busy ||
                (mode === 'legacy' && (!hasLegacyBranch || !hasLegacyLegalForm))
              }
              onClick={handleAnalyze}
            >
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
              {importing ? 'Creating customers…' : 'Create customers'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

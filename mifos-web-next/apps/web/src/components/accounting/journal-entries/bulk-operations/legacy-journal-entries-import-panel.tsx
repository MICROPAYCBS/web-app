'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Download, Upload } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createLegacyJournalEntriesAction,
  type LegacyJournalEntriesPostGroupResult
} from '@/actions/journal-entries';
import { LegacyJournalEntriesImportReview } from '@/components/accounting/journal-entries/bulk-operations/legacy-journal-entries-import-review';
import { TitleWithHint } from '@/components/composites/field-hint-tooltip';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { currencySelectOptions } from '@/lib/accounting/journal-entry-display';
import {
  analyzeLegacyJournalImportRows,
  LEGACY_JOURNAL_ENTRIES_TEMPLATE_FILENAME,
  LEGACY_JOURNAL_ENTRIES_TEMPLATE_PATH,
  type LegacyImportAnalysis,
  type LegacyImportLookupDepartment,
  type LegacyImportLookupGlAccount,
  type LegacyImportLookupOffice
} from '@/lib/accounting/legacy-journal-entries-import';
import { buildPostLegacyJournalEntriesInput } from '@/lib/accounting/legacy-journal-entries-post';
import { parseLegacyJournalEntriesFile } from '@/lib/accounting/legacy-journal-entries-workbook';
import { cn } from '@/lib/utils';

const LEGACY_TEMPLATE_FIELD_HINT =
  'Fill ACCT_NO, Amount, DEBIT/CREDIT (DR or CR), REFERENCE, COMMENT, and EFFECTIVE DATE. Rows with the same date and reference form one journal entry and must balance. ACCT_NO is 10 digits after removing hyphens: branch id (2) + department id (2, or 00) + GL code (6). ACCT TYPE is ignored. Currency is not in the template, so choose it below before posting.';

export function LegacyJournalEntriesImportPanel({
  canDownload,
  canPost,
  offices,
  departments,
  glAccounts,
  currencies
}: {
  canDownload: boolean;
  canPost: boolean;
  offices: LegacyImportLookupOffice[];
  departments: LegacyImportLookupDepartment[];
  glAccounts: LegacyImportLookupGlAccount[];
  currencies: FineractCurrencyOption[];
}) {
  const currencyOptions = currencySelectOptions(currencies);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<LegacyImportAnalysis | null>(null);
  const [currencyCode, setCurrencyCode] = useState(currencyOptions[0]?.value ?? '');
  const [postResults, setPostResults] = useState<LegacyJournalEntriesPostGroupResult[] | null>(
    null
  );
  const [analyzing, startAnalyzeTransition] = useTransition();
  const [posting, startPostTransition] = useTransition();
  const busy = analyzing || posting;
  const fullyPosted =
    postResults != null &&
    postResults.length > 0 &&
    postResults.every((result) => result.ok);

  function handleDownloadTemplate() {
    const link = document.createElement('a');
    link.href = LEGACY_JOURNAL_ENTRIES_TEMPLATE_PATH;
    link.download = LEGACY_JOURNAL_ENTRIES_TEMPLATE_FILENAME;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function clearReview() {
    setAnalysis(null);
    setPostResults(null);
    setSelectedFile(null);
    setFileInputKey((current) => current + 1);
  }

  function handleAnalyze() {
    if (!selectedFile) {
      return;
    }

    startAnalyzeTransition(async () => {
      const parsed = await parseLegacyJournalEntriesFile(selectedFile);
      if (!parsed.ok) {
        setAnalysis(null);
        setPostResults(null);
        toast.error(parsed.message);
        return;
      }

      const next = analyzeLegacyJournalImportRows(parsed.rows, {
        offices,
        departments,
        glAccounts
      });
      setAnalysis(next);
      setPostResults(null);
      if (next.canPost) {
        toast.success('File analyzed. Review the matched rows below before posting.');
      } else {
        toast.message('File analyzed with errors. Fix the highlighted rows and upload again.');
      }
    });
  }

  function handlePost() {
    if (!analysis?.canPost) {
      return;
    }
    if (!currencyCode) {
      toast.error('Currency is required.');
      return;
    }

    startPostTransition(async () => {
      try {
        const input = buildPostLegacyJournalEntriesInput(analysis, currencyCode);
        const result = await createLegacyJournalEntriesAction(input);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        setPostResults(result.results);
        if (result.failureCount === 0) {
          toast.success(
            result.successCount === 1
              ? 'Posted 1 journal entry.'
              : `Posted ${result.successCount} journal entries.`
          );
        } else if (result.successCount === 0) {
          toast.error('No journal entries were posted. See details below.');
        } else {
          toast.message(
            `Posted ${result.successCount} of ${result.successCount + result.failureCount} journal entries. See details below.`
          );
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to post journal entries.');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <TitleWithHint
              hint={LEGACY_TEMPLATE_FIELD_HINT}
              hintAriaLabel="Legacy journal entry template field help"
            >
              <h2 className="text-base font-medium">Legacy journal entries template</h2>
            </TitleWithHint>
          </div>
          <Can permission="READ_JOURNALENTRY">
            {canDownload ? (
              <Button type="button" onClick={handleDownloadTemplate}>
                <Download className="mr-2 size-4" />
                Download template
              </Button>
            ) : null}
          </Can>
        </section>

        <section className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-base font-medium">Legacy journal entries</h2>
          <div className="space-y-2">
            <label htmlFor="legacy-journal-import-file" className="text-sm font-medium">
              Select Excel file
            </label>
            <Input
              key={fileInputKey}
              id="legacy-journal-import-file"
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setAnalysis(null);
                setPostResults(null);
              }}
            />
          </div>
          <SelectField
            label="Currency"
            required
            value={currencyCode || undefined}
            onValueChange={(value) => {
              setCurrencyCode(value ?? '');
              setPostResults(null);
            }}
            options={currencyOptions}
            placeholder="Select currency"
            disabled={busy || currencyOptions.length === 0}
          />
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
        <LegacyJournalEntriesImportReview analysis={analysis} currencyCode={currencyCode} />
      ) : null}

      {postResults && postResults.length > 0 ? (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <h2 className="text-base font-medium">Posting results</h2>
          <ul className="space-y-2 text-sm">
            {postResults.map((result) => (
              <li
                key={result.groupKey}
                className={cn(
                  'rounded-md border px-3 py-2',
                  result.ok
                    ? 'border-border bg-muted/30 text-foreground'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                )}
              >
                <span className="font-medium">
                  {result.effectiveDate}
                  {result.reference ? ` / ${result.reference}` : ''}
                </span>
                {result.ok ? (
                  <span className="ml-2 text-muted-foreground">
                    {result.pending
                      ? 'Submitted for approval'
                      : result.transactionId
                        ? `Posted · ${result.transactionId}`
                        : 'Posted'}
                  </span>
                ) : (
                  <span className="ml-2">{result.message}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {analysis ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={clearReview}>
            Choose another file
          </Button>
          <Can permission="CREATE_JOURNALENTRY">
            <Button
              type="button"
              disabled={!canPost || !analysis.canPost || !currencyCode || busy || fullyPosted}
              onClick={handlePost}
            >
              {posting ? 'Posting…' : fullyPosted ? 'Posted' : 'Post journal entries'}
            </Button>
          </Can>
        </div>
      ) : null}
    </div>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { areJournalEntryTotalsBalanced } from '@mifos/domain';
import { useMemo } from 'react';
import { JournalEntryTotalsSummary } from '@/components/accounting/journal-entry-totals-summary';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection
} from '@/components/composites';
import { formatJournalEntryGlAccountLabel, ruleAccountToGlOption } from '@/lib/accounting/journal-entry-display';
import {
  expandBulkConstructRowToJournalEntry,
  isBulkConstructEligibleRule
} from '@/lib/accounting/bulk-journal-construct';
import type { BulkConstructStepProps } from '../types';

export function BulkConstructReviewStep({
  form,
  accountingRules,
  currencies,
  offices,
  departments,
  submitError,
  postResults
}: BulkConstructStepProps & {
  submitError: string | null;
  postResults: Array<
    | { rowIndex: number; ok: true; transactionId?: string; pending?: boolean }
    | { rowIndex: number; ok: false; message: string }
  > | null;
}) {
  const { template, rows } = form;
  const selectedRule = accountingRules.find((rule) => rule.id === template.accountingRuleId);

  const constructedEntries = useMemo(() => {
    if (!selectedRule || !isBulkConstructEligibleRule(selectedRule)) {
      return [];
    }
    return rows.map((row, rowIndex) => ({
      rowIndex,
      entry: expandBulkConstructRowToJournalEntry(template, row, selectedRule, currencies)
    }));
  }, [currencies, rows, selectedRule, template]);

  const officeName = (officeId: number) => {
    const office = offices.find((row) => row.id === officeId);
    return office?.name ?? office?.nameDecorated ?? String(officeId);
  };

  const departmentName = (departmentId?: number) => {
    if (departmentId == null) {
      return '—';
    }
    const department = departments.find((row) => row.id === departmentId);
    return department?.departmentName ?? String(departmentId);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review each constructed entry before posting. Entries are submitted one at a time; successful
        posts are kept even if a later row fails.
      </p>

      {submitError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <DetailSection title="Shared template">
        <DetailFieldGrid>
          <DetailField label="Posting template">{selectedRule?.name ?? '—'}</DetailField>
          <DetailField label="Variation mode">
            {template.variationMode === 'branch' ? 'By branch' : 'By department'}
          </DetailField>
          <DetailField label="Branch">{officeName(template.defaultOfficeId)}</DetailField>
          <DetailField label="Currency">{template.currencyCode || '—'}</DetailField>
          <DetailField label="Transaction date">{template.transactionDate || '—'}</DetailField>
          <DetailField label="Reference number">{template.referenceNumber?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <div className="space-y-4">
        {constructedEntries.map(({ rowIndex, entry }) => {
          if (!entry || !selectedRule) {
            return null;
          }
          const row = rows[rowIndex];
          const result = postResults?.find((item) => item.rowIndex === rowIndex);
          const variationLabel =
            template.variationMode === 'branch'
              ? officeName(row.officeId ?? template.defaultOfficeId)
              : departmentName(row.departmentId);

          return (
            <section key={`review-entry-${rowIndex}`} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">
                    Entry {rowIndex + 1}: {variationLabel}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.variationMode === 'branch' ? 'Branch' : 'Department'} variation
                  </p>
                </div>
                {result ? (
                  result.ok ? (
                    <p className="text-sm text-primary">
                      {result.pending ? 'Sent for approval' : 'Posted'}
                      {result.transactionId ? ` (${result.transactionId})` : ''}
                    </p>
                  ) : (
                    <p className="text-sm text-destructive">{result.message}</p>
                  )
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Debits</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {entry.debits.map((line, lineIndex) => {
                      const account = selectedRule.debitAccounts?.find(
                        (row) => row.id === line.glAccountId
                      );
                      return (
                        <li
                          key={`review-debit-${rowIndex}-${lineIndex}`}
                          className="rounded-md border border-border px-3 py-2"
                        >
                          {account
                            ? formatJournalEntryGlAccountLabel(ruleAccountToGlOption(account))
                            : `Account ${line.glAccountId}`}{' '}
                          — {line.amount}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium">Credits</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {entry.credits.map((line, lineIndex) => {
                      const account = selectedRule.creditAccounts?.find(
                        (row) => row.id === line.glAccountId
                      );
                      return (
                        <li
                          key={`review-credit-${rowIndex}-${lineIndex}`}
                          className="rounded-md border border-border px-3 py-2"
                        >
                          {account
                            ? formatJournalEntryGlAccountLabel(ruleAccountToGlOption(account))
                            : `Account ${line.glAccountId}`}{' '}
                          — {line.amount}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <JournalEntryTotalsSummary
                  debits={entry.debits}
                  credits={entry.credits}
                  currencyCode={entry.currencyCode}
                />
              </div>

              {!areJournalEntryTotalsBalanced(entry.debits, entry.credits) ? (
                <p className="mt-3 text-sm text-destructive">
                  This entry is not balanced. Go back to variations to fix the amount.
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

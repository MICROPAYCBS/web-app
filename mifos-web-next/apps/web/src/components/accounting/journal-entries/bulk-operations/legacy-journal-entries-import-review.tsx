'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { LegacyImportAnalysis } from '@/lib/accounting/legacy-journal-entries-import';
import { cn } from '@/lib/utils';

export function LegacyJournalEntriesImportReview({
  analysis,
  currencyCode
}: {
  analysis: LegacyImportAnalysis;
  currencyCode?: string;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-medium">Import review</h2>
          <p className="text-sm text-muted-foreground">
            {analysis.validLineCount} line{analysis.validLineCount === 1 ? '' : 's'} analyzed across{' '}
            {analysis.groups.length} journal entr
            {analysis.groups.length === 1 ? 'y' : 'ies'}.
            {analysis.errorRowCount > 0
              ? ` ${analysis.errorRowCount} row${analysis.errorRowCount === 1 ? '' : 's'} need attention.`
              : ' Ready to post.'}
            {currencyCode ? ` Entries will post in ${currencyCode}.` : ' Select a currency before posting.'}
          </p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
            analysis.canPost
              ? 'border-border bg-muted/40 text-foreground'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          )}
        >
          {analysis.canPost ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
          )}
          {analysis.canPost ? 'No blocking errors' : 'Fix errors before posting'}
        </div>
      </div>

      {analysis.groupIssues.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {analysis.groupIssues.map((issue) => (
            <li key={`${issue.groupKey}:${issue.message}`}>
              {issue.effectiveDate}
              {issue.reference ? ` / ${issue.reference}` : ''}: {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Row</th>
              <th className="px-3 py-2 font-medium">Account no.</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">GL account</th>
              <th className="px-3 py-2 font-medium">Side</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {analysis.rows.map((row) => {
              const hasErrors = row.errors.length > 0 || row.groupErrors.length > 0;
              return (
                <tr
                  key={row.rowNumber}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    hasErrors ? 'bg-destructive/5' : undefined
                  )}
                >
                  <td className="px-3 py-2 align-top tabular-nums">{row.rowNumber}</td>
                  <td className="px-3 py-2 align-top font-mono text-xs">
                    {row.match?.accountNumber || row.rawAccountNumber || '—'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {row.match ? (
                      <span>
                        {row.match.branchName}{' '}
                        <span className="text-muted-foreground">(#{row.match.branchId})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {row.match?.departmentIgnored ? (
                      <span className="text-muted-foreground">None (00)</span>
                    ) : row.match?.departmentName ? (
                      <span>
                        {row.match.departmentName}{' '}
                        <span className="text-muted-foreground">(#{row.match.departmentId})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {row.match ? (
                      <span>
                        {row.match.glCode} · {row.match.glAccountName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">{row.match?.side || row.rawSide || '—'}</td>
                  <td className="px-3 py-2 align-top tabular-nums">
                    {row.match ? row.match.amount : row.rawAmount || '—'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {row.match?.effectiveDate || row.rawEffectiveDate || '—'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {row.match?.reference || row.rawReference || '—'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {hasErrors ? (
                      <ul className="space-y-1 text-destructive">
                        {[...row.errors, ...row.groupErrors].map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">Matched</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

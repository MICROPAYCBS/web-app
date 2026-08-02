'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ClientsImportRowProgress } from '@/lib/clients/clients-import';
import { cn } from '@/lib/utils';

export type ClientsImportReviewRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  officeName?: string;
  mobile?: string;
  phoneNumber?: string;
  externalId?: string;
  customerClass?: string;
  customerType?: string;
  errors: string[];
  warnings: string[];
};

export type ClientsImportReviewAnalysis = {
  rows: ClientsImportReviewRow[];
  rowCount: number;
  errorRowCount: number;
  warningRowCount: number;
  canCreate: boolean;
};

function progressLabel(progress: ClientsImportRowProgress | undefined) {
  if (!progress) {
    return 'Ready';
  }

  switch (progress.status) {
    case 'pending':
      return 'Waiting';
    case 'creating':
      return 'Creating…';
    case 'success':
      return progress.resourceId ? `Created · #${progress.resourceId}` : 'Created';
    case 'pending_approval':
      return 'Sent for approval';
    case 'failed':
      return progress.message ?? 'Failed';
    default:
      return 'Ready';
  }
}

export function ClientsImportReview({
  analysis,
  progressByRow,
  importing = false
}: {
  analysis: ClientsImportReviewAnalysis;
  progressByRow?: Record<number, ClientsImportRowProgress>;
  importing?: boolean;
}) {
  const completedCount = progressByRow
    ? Object.values(progressByRow).filter(
        (entry) => entry.status === 'success' || entry.status === 'pending_approval'
      ).length
    : 0;
  const failedCount = progressByRow
    ? Object.values(progressByRow).filter((entry) => entry.status === 'failed').length
    : 0;
  const showProgress = importing || completedCount > 0 || failedCount > 0;

  return (
    <section className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-medium">Import review</h2>
          <p className="text-sm text-muted-foreground">
            {analysis.rowCount} customer{analysis.rowCount === 1 ? '' : 's'} found.
            {showProgress
              ? ` ${completedCount} created${failedCount > 0 ? `, ${failedCount} failed` : ''}.`
              : analysis.errorRowCount > 0
                ? ` ${analysis.errorRowCount} row${analysis.errorRowCount === 1 ? '' : 's'} need attention before creating customers.`
                : analysis.warningRowCount > 0
                  ? ` ${analysis.warningRowCount} row${analysis.warningRowCount === 1 ? '' : 's'} have warnings but can be created.`
                  : ' Ready to create customers.'}
          </p>
        </div>
        {!showProgress ? (
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
              analysis.canCreate
                ? 'border-border bg-muted/40 text-foreground'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            )}
          >
            {analysis.canCreate ? (
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
            )}
            {analysis.canCreate ? 'No blocking errors' : 'Fix errors before creating'}
          </div>
        ) : null}
      </div>

      {showProgress ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="tabular-nums">
              {completedCount + failedCount} / {analysis.rowCount}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${analysis.rowCount === 0 ? 0 : ((completedCount + failedCount) / analysis.rowCount) * 100}%`
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Row</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Office</th>
              <th className="px-3 py-2 font-medium">Mobile</th>
              <th className="px-3 py-2 font-medium">External ID</th>
              <th className="px-3 py-2 font-medium">Class / type</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {analysis.rows.map((row) => {
              const progress = progressByRow?.[row.rowNumber];
              const hasErrors = !progress && row.errors.length > 0;
              const hasWarnings = !progress && row.warnings.length > 0;
              const isCreating = progress?.status === 'creating';
              const isFailed = progress?.status === 'failed';
              const isSuccess =
                progress?.status === 'success' || progress?.status === 'pending_approval';

              return (
                <tr
                  key={row.rowNumber}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    isFailed || hasErrors
                      ? 'bg-destructive/5'
                      : isSuccess
                        ? 'bg-muted/20'
                        : hasWarnings
                          ? 'bg-muted/10'
                          : undefined
                  )}
                >
                  <td className="px-3 py-2 align-top tabular-nums">{row.rowNumber}</td>
                  <td className="px-3 py-2 align-top">
                    {[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-3 py-2 align-top">{row.officeName || '—'}</td>
                  <td className="px-3 py-2 align-top">{row.mobile || row.phoneNumber || '—'}</td>
                  <td className="px-3 py-2 align-top font-mono text-xs">{row.externalId || '—'}</td>
                  <td className="px-3 py-2 align-top">
                    {row.customerClass || row.customerType || '—'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {progress ? (
                      <div
                        className={cn(
                          'inline-flex items-center gap-2',
                          isFailed
                            ? 'text-destructive'
                            : isSuccess
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                        )}
                      >
                        {isCreating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                        <span>{progressLabel(progress)}</span>
                      </div>
                    ) : hasErrors ? (
                      <ul className="space-y-1 text-destructive">
                        {row.errors.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    ) : hasWarnings ? (
                      <ul className="space-y-1 text-muted-foreground">
                        {row.warnings.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">Ready</span>
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

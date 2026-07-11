'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CentralBranchExpensePaymentRowResult,
  CreateCentralBranchExpensePaymentResult
} from '@/actions/central-branch-expense-payments';
import { JournalEntryTransactionLink } from '@/components/accounting/journal-entries/journal-entry-transaction-panel';
import { Button } from '@/components/ui/button';

function roleLabel(role: CentralBranchExpensePaymentRowResult['role']) {
  return role === 'ho_funding' ? 'Source' : 'Branch';
}

export function ResultsStep({
  result,
  pendingReverse,
  onReversePosted
}: {
  result: CreateCentralBranchExpensePaymentResult & { ok: true };
  pendingReverse: boolean;
  onReversePosted: () => void;
}) {
  const postedIds = result.results
    .filter((row): row is Extract<CentralBranchExpensePaymentRowResult, { ok: true }> => row.ok)
    .map((row) => row.transactionId)
    .filter((id): id is string => Boolean(id?.trim()));

  const hasPartialFailure = result.failureCount > 0 && result.successCount > 0;
  const allFailed = result.successCount === 0 && result.failureCount > 0;

  return (
    <div className="space-y-6">
      {hasPartialFailure ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">
            {result.successCount} of {result.results.length} journal entries posted.
          </p>
          <p className="mt-1 text-muted-foreground">
            The batch stopped at the first failure. Review posted entries below and reverse them if
            needed before retrying.
          </p>
        </div>
      ) : null}

      {allFailed ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No journal entries were posted.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Office</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Transaction</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((row) => (
              <tr key={`${row.step}-${row.officeId}`} className="border-t border-border">
                <td className="px-4 py-3">{row.officeName}</td>
                <td className="px-4 py-3">{roleLabel(row.role)}</td>
                <td className="px-4 py-3">
                  {row.ok && row.transactionId ? (
                    <JournalEntryTransactionLink transactionId={row.transactionId} />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.ok ? (row.pending ? 'Pending approval' : 'Posted') : row.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {postedIds.length > 0 && result.failureCount > 0 ? (
        <Button
          type="button"
          variant="destructive"
          onClick={onReversePosted}
          disabled={pendingReverse}
        >
          {pendingReverse ? 'Reversing posted entries…' : 'Reverse posted entries'}
        </Button>
      ) : null}
    </div>
  );
}

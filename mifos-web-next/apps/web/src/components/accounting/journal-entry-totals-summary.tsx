'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  areJournalEntryTotalsBalanced,
  formatMoney,
  journalEntryBalanceDifference,
  JOURNAL_ENTRY_UNBALANCED_MESSAGE,
  sumJournalEntryLineAmounts
} from '@mifos/domain';
import type { JournalEntryLineInput } from '@mifos/validation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { MoneyValue } from '@/components/composites/detail/money-value';
import { cn } from '@/lib/utils';

function formatDifferenceHint(
  difference: ReturnType<typeof journalEntryBalanceDifference>,
  currencyCode: string
) {
  if (difference.isZero()) {
    return null;
  }
  const formatted = formatMoney(difference.abs(), currencyCode, 'en');
  if (!formatted) {
    return null;
  }
  if (difference.isPositive()) {
    return `Debits exceed credits by ${formatted}.`;
  }
  return `Credits exceed debits by ${formatted}.`;
}

export function JournalEntryTotalsSummary({
  debits,
  credits,
  currencyCode,
  error
}: {
  debits: JournalEntryLineInput[];
  credits: JournalEntryLineInput[];
  currencyCode: string;
  error?: string;
}) {
  const { debitTotal, creditTotal, isBalanced, difference, hasAmounts } = useMemo(() => {
    const debitTotal = sumJournalEntryLineAmounts(debits);
    const creditTotal = sumJournalEntryLineAmounts(credits);
    const isBalanced = areJournalEntryTotalsBalanced(debits, credits);
    const difference = journalEntryBalanceDifference(debits, credits);
    const hasAmounts = debitTotal.gt(0) || creditTotal.gt(0);
    return { debitTotal, creditTotal, isBalanced, difference, hasAmounts };
  }, [debits, credits]);

  const showBalanced = isBalanced && hasAmounts;
  const showUnbalanced = hasAmounts && !isBalanced;
  const differenceHint = currencyCode ? formatDifferenceHint(difference, currencyCode) : null;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        showBalanced
          ? 'border-primary/30 bg-primary/5'
          : showUnbalanced
            ? 'border-destructive/30 bg-destructive/5'
            : 'border-border bg-muted/30'
      )}
      aria-live="polite"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Total debits</p>
          <p className="mt-1 text-lg font-medium">
            {currencyCode ? (
              <MoneyValue amount={debitTotal} currencyCode={currencyCode} />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total credits</p>
          <p className="mt-1 text-lg font-medium">
            {currencyCode ? (
              <MoneyValue amount={creditTotal} currencyCode={currencyCode} />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Difference</p>
          <p
            className={cn(
              'mt-1 text-lg font-medium tabular-nums',
              showBalanced && 'text-primary',
              showUnbalanced && 'text-destructive'
            )}
          >
            {showBalanced ? (
              'Balanced'
            ) : showUnbalanced && currencyCode ? (
              <MoneyValue amount={difference.abs()} currencyCode={currencyCode} />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>
      </div>

      {showUnbalanced ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {error ?? JOURNAL_ENTRY_UNBALANCED_MESSAGE}
            {differenceHint ? ` ${differenceHint}` : ''}
          </span>
        </p>
      ) : showBalanced ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Debits and credits are balanced. You can submit this entry.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Enter debit and credit amounts. Totals must match before you can submit.
        </p>
      )}
    </div>
  );
}

'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import {
  buildCentralBranchExpensePaymentReview,
  type CentralBranchExpenseReviewSection
} from '@/lib/accounting/central-branch-expense-payment';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { formatJournalEntryGlAccountLabel } from '@/lib/accounting/journal-entry-display';
import type { CentralBranchPaymentStepProps } from './types';

function ReviewSectionBlock({
  section,
  currencyCode
}: {
  section: CentralBranchExpenseReviewSection;
  currencyCode: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">{section.title}</h3>
        <p className="text-sm text-muted-foreground">Office: {section.officeName}</p>
      </div>
      <div className="space-y-2 font-mono text-sm">
        {section.lines.map((line, index) => (
          <div key={`${line.side}-${index}`} className="grid grid-cols-[4rem_1fr_auto] gap-3">
            <span className="text-muted-foreground">{line.side === 'debit' ? 'Dr' : 'Cr'}</span>
            <span>{line.label}</span>
            <span className="tabular-nums text-right">
              {formatAccountMoney(line.amount, currencyCode)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewPostStep({
  form,
  offices,
  glAccounts,
  clearingGlAccountId,
  clearingGlAccountLabel,
  clearingWarning
}: CentralBranchPaymentStepProps) {
  const glAccountLabels = useMemo(
    () =>
      Object.fromEntries(
        glAccounts.map((account) => [account.id, formatJournalEntryGlAccountLabel(account)])
      ),
    [glAccounts]
  );

  const officeNamesById = useMemo(
    () =>
      Object.fromEntries(
        offices.map((office) => [office.id, office.name ?? office.nameDecorated ?? String(office.id)])
      ),
    [offices]
  );

  const review = useMemo(
    () =>
      buildCentralBranchExpensePaymentReview(
        {
          ...form,
          clearingGlAccountId,
          officeNamesById
        },
        glAccountLabels
      ),
    [clearingGlAccountId, form, glAccountLabels, officeNamesById]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review entries before posting. Credits consolidate at the source office; each branch
        receives its debit and clearing legs separately.
      </p>

      {clearingWarning ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
          {clearingWarning}
        </div>
      ) : null}

      <ReviewSectionBlock section={review.funding} currencyCode={form.currencyCode} />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Branches</h3>
        {review.branches.map((section) => (
          <ReviewSectionBlock
            key={section.officeName}
            section={section}
            currencyCode={form.currencyCode}
          />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <p>
          Creates <span className="font-semibold">{review.journalEntryCount} journal entries</span>{' '}
          linked by reference <span className="font-mono">{form.referenceNumber}</span>.
        </p>
        <p className="mt-1 text-muted-foreground">
          Clearing:{' '}
          <span className="font-medium text-foreground">{clearingGlAccountLabel}</span>
        </p>
      </div>
    </div>
  );
}

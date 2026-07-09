'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { JournalEntryTotalsSummary } from '@/components/accounting/journal-entry-totals-summary';
import { JournalEntryLinesEditor } from '@/components/accounting/journal-entries/journal-entry-lines-editor';
import { resolveJournalEntryLineConstraints } from '@/lib/accounting/journal-entry-display';
import type { JournalEntryStepProps } from '../types';

export function LinesStep({
  form,
  errors,
  pending,
  onPatch,
  glAccounts,
  accountingRules
}: JournalEntryStepProps) {
  const lineConstraints = useMemo(
    () =>
      resolveJournalEntryLineConstraints({
        form,
        accountingRules,
        glAccounts
      }),
    [form, accountingRules, glAccounts]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Enter debit and credit lines. Totals must balance before you can post.
        {lineConstraints.allowMultipleDebitEntries && lineConstraints.allowMultipleCreditEntries
          ? ' Use Add line to post to more than one account per side.'
          : null}
      </p>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <JournalEntryLinesEditor
          label="Debits"
          lines={form.debits}
          fieldPrefix="debits"
          glAccounts={lineConstraints.debitGlAccounts}
          currencyCode={form.currencyCode}
          fieldErrors={errors}
          pending={pending}
          allowMultiple={lineConstraints.allowMultipleDebitEntries}
          onChange={(debits) => onPatch({ debits })}
        />

        <JournalEntryLinesEditor
          label="Credits"
          lines={form.credits}
          fieldPrefix="credits"
          glAccounts={lineConstraints.creditGlAccounts}
          currencyCode={form.currencyCode}
          fieldErrors={errors}
          pending={pending}
          allowMultiple={lineConstraints.allowMultipleCreditEntries}
          onChange={(credits) => onPatch({ credits })}
        />
      </div>

      <JournalEntryTotalsSummary
        debits={form.debits}
        credits={form.credits}
        currencyCode={form.currencyCode}
        error={errors.balance}
      />
    </div>
  );
}

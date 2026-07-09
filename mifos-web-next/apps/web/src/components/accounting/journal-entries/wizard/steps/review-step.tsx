'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryGlAccountOption } from '@mifos/api-client';
import { areJournalEntryTotalsBalanced } from '@mifos/domain';
import { useMemo } from 'react';
import { JournalEntryTotalsSummary } from '@/components/accounting/journal-entry-totals-summary';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection
} from '@/components/composites';
import { MoneyValue } from '@/components/composites/detail/money-value';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  formatJournalEntryGlAccountLabel,
  resolveJournalEntryLineConstraints
} from '@/lib/accounting/journal-entry-display';
import type { JournalEntryStepProps } from '../types';

function formatLineSummary(
  glAccounts: FineractJournalEntryGlAccountOption[],
  glAccountId: number,
  amount: number,
  currencyCode: string
) {
  const account = glAccounts.find((row) => row.id === glAccountId);
  const label = account ? formatJournalEntryGlAccountLabel(account) : `Account ${glAccountId}`;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span>{label}</span>
      {amount > 0 && currencyCode ? (
        <MoneyValue amount={amount} currencyCode={currencyCode} className="font-medium" />
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </span>
  );
}

export function ReviewStep({
  form,
  errors,
  pending,
  onPatch,
  offices,
  departments,
  accountingRules,
  glAccounts,
  paymentTypes,
  submitError
}: JournalEntryStepProps & { submitError: string | null }) {
  const officeLabel = useMemo(() => {
    const office = offices.find((row) => row.id === form.officeId);
    return office?.name ?? office?.nameDecorated ?? '—';
  }, [offices, form.officeId]);

  const departmentLabel = useMemo(() => {
    if (form.departmentId == null) {
      return '—';
    }
    const department = departments.find((row) => row.id === form.departmentId);
    return department?.departmentName ?? String(form.departmentId);
  }, [departments, form.departmentId]);

  const templateLabel = useMemo(() => {
    if (form.accountingRule == null) {
      return 'Manual entry';
    }
    const rule = accountingRules.find((row) => row.id === form.accountingRule);
    return rule?.name ?? String(form.accountingRule);
  }, [accountingRules, form.accountingRule]);

  const lineConstraints = useMemo(
    () =>
      resolveJournalEntryLineConstraints({
        form,
        accountingRules,
        glAccounts
      }),
    [form, accountingRules, glAccounts]
  );

  const debitGlAccounts = lineConstraints.debitGlAccounts;
  const creditGlAccounts = lineConstraints.creditGlAccounts;

  const paymentTypeOptions = useMemo(
    () =>
      paymentTypes.map((paymentType) => ({
        value: String(paymentType.id),
        label: paymentType.name
      })),
    [paymentTypes]
  );

  const isBalanced = areJournalEntryTotalsBalanced(form.debits, form.credits);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the entry, add optional payment details or comments, then post.
      </p>

      {submitError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <DetailSection title="Posting details">
        <DetailFieldGrid>
          <DetailField label="Branch">{officeLabel}</DetailField>
          <DetailField label="Department">{departmentLabel}</DetailField>
          <DetailField label="Posting template">{templateLabel}</DetailField>
          <DetailField label="Currency">{form.currencyCode || '—'}</DetailField>
          <DetailField label="Transaction date">{form.transactionDate || '—'}</DetailField>
          <DetailField label="Reference number">{form.referenceNumber?.trim() || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Journal lines">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium">Debits</p>
            <ul className="space-y-2 text-sm">
              {form.debits.map((line, index) => (
                <li
                  key={`review-debit-${index}`}
                  className="rounded-md border border-border px-3 py-2"
                >
                  {formatLineSummary(debitGlAccounts, line.glAccountId, line.amount, form.currencyCode)}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Credits</p>
            <ul className="space-y-2 text-sm">
              {form.credits.map((line, index) => (
                <li
                  key={`review-credit-${index}`}
                  className="rounded-md border border-border px-3 py-2"
                >
                  {formatLineSummary(
                    creditGlAccounts,
                    line.glAccountId,
                    line.amount,
                    form.currencyCode
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4">
          <JournalEntryTotalsSummary
            debits={form.debits}
            credits={form.credits}
            currencyCode={form.currencyCode}
          />
        </div>
      </DetailSection>

      <DetailSection title="Payment details" description="Optional">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Payment type"
            optional
            value={form.paymentTypeId ? String(form.paymentTypeId) : undefined}
            onValueChange={(value) =>
              onPatch({ paymentTypeId: value ? Number(value) : undefined })
            }
            options={paymentTypeOptions}
            placeholder="Select payment type"
            disabled={pending}
            error={errors.paymentTypeId}
          />
          <TextField
            label="Account number"
            optional
            value={form.accountNumber ?? ''}
            onChange={(value) => onPatch({ accountNumber: value })}
            disabled={pending}
          />
          <TextField
            label="Cheque number"
            optional
            value={form.checkNumber ?? ''}
            onChange={(value) => onPatch({ checkNumber: value })}
            disabled={pending}
          />
          <TextField
            label="Routing code"
            optional
            value={form.routingCode ?? ''}
            onChange={(value) => onPatch({ routingCode: value })}
            disabled={pending}
          />
          <TextField
            label="Receipt number"
            optional
            value={form.receiptNumber ?? ''}
            onChange={(value) => onPatch({ receiptNumber: value })}
            disabled={pending}
          />
          <TextField
            label="Bank number"
            optional
            value={form.bankNumber ?? ''}
            onChange={(value) => onPatch({ bankNumber: value })}
            disabled={pending}
          />
        </div>
      </DetailSection>

      <TextField
        label="Comments"
        optional
        multiline
        rows={3}
        value={form.comments ?? ''}
        onChange={(value) => onPatch({ comments: value })}
        disabled={pending}
        error={errors.comments}
      />

      {!isBalanced ? (
        <p className="text-sm text-destructive">
          Debits and credits are not balanced. Go back to journal lines to fix amounts.
        </p>
      ) : null}
    </div>
  );
}

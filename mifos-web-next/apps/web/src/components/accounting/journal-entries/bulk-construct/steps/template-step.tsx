'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  bulkConstructRuleIneligibilityReason,
  bulkConstructRuleLineSummary,
  isBulkConstructEligibleRule,
  partitionBulkConstructRules
} from '@/lib/accounting/bulk-journal-construct';
import { currencySelectOptions, formatJournalEntryGlAccountLabel } from '@/lib/accounting/journal-entry-display';
import type { BulkConstructStepProps } from '../types';

const VARIATION_MODE_OPTIONS = [
  { value: 'branch', label: 'By branch' },
  { value: 'department', label: 'By department' }
] as const;

export function BulkConstructTemplateStep({
  form,
  errors,
  pending,
  onPatchTemplate,
  offices,
  currencies,
  accountingRules
}: BulkConstructStepProps) {
  const { template } = form;
  const { eligible, ineligible } = useMemo(
    () => partitionBulkConstructRules(accountingRules),
    [accountingRules]
  );

  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: office.name ?? office.nameDecorated ?? String(office.id)
      })),
    [offices]
  );

  const ruleOptions = useMemo(
    () => [
      ...eligible.map((rule) => ({
        value: String(rule.id),
        label: rule.name,
        disabled: false
      })),
      ...ineligible.map((rule) => ({
        value: String(rule.id),
        label: `${rule.name} (not supported)`,
        disabled: true
      }))
    ],
    [eligible, ineligible]
  );

  const selectedRule = useMemo(
    () => accountingRules.find((rule) => rule.id === template.accountingRuleId),
    [accountingRules, template.accountingRuleId]
  );

  const ruleSummary = selectedRule ? bulkConstructRuleLineSummary(selectedRule) : null;
  const selectedIneligibleReason =
    selectedRule && !isBulkConstructEligibleRule(selectedRule)
      ? bulkConstructRuleIneligibilityReason(selectedRule)
      : null;

  const defaultOfficeId = template.defaultOfficeId > 0 ? template.defaultOfficeId : undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose a posting template and shared details. Each variation row will become its own journal
        entry with the same GL structure.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Posting template"
          required
          value={template.accountingRuleId > 0 ? String(template.accountingRuleId) : undefined}
          onValueChange={(value) => {
            if (!value) {
              return;
            }
            onPatchTemplate({ accountingRuleId: Number(value) });
          }}
          options={ruleOptions}
          placeholder="Select accounting rule"
          disabled={pending}
          error={errors['template.accountingRuleId'] ?? errors.accountingRuleId}
          hint="Only rules with fixed debit and credit GL accounts are supported."
        />
        <SelectField
          label="Variation mode"
          required
          value={template.variationMode}
          onValueChange={(value) => {
            if (value === 'branch' || value === 'department') {
              onPatchTemplate({ variationMode: value });
            }
          }}
          options={[...VARIATION_MODE_OPTIONS]}
          disabled={pending}
          error={errors['template.variationMode'] ?? errors.variationMode}
          hint={
            template.variationMode === 'branch'
              ? 'Each row posts to a different branch.'
              : 'Each row posts to a different department at the selected branch.'
          }
        />
        <SelectField
          label={template.variationMode === 'department' ? 'Branch' : 'Default branch'}
          required
          value={defaultOfficeId != null ? String(defaultOfficeId) : undefined}
          onValueChange={(value) => {
            if (!value) {
              return;
            }
            onPatchTemplate({
              defaultOfficeId: Number(value),
              departmentId: undefined
            });
          }}
          options={officeOptions}
          placeholder="Select branch"
          disabled={pending}
          error={errors['template.defaultOfficeId'] ?? errors.defaultOfficeId}
          hint={
            template.variationMode === 'branch'
              ? 'Used when a variation row does not pick its own branch.'
              : undefined
          }
        />
        {template.variationMode === 'branch' ? (
          <p className="text-sm text-muted-foreground md:col-span-2">
            Choose an optional department on each branch variation row — only departments mapped to
            that branch are listed.
          </p>
        ) : null}
        <SelectField
          label="Currency"
          required
          value={template.currencyCode || undefined}
          onValueChange={(value) => {
            if (value) {
              onPatchTemplate({ currencyCode: value });
            }
          }}
          options={currencySelectOptions(currencies)}
          placeholder="Select currency"
          disabled={pending}
          error={errors['template.currencyCode'] ?? errors.currencyCode}
        />
        <TransactionDateField
          label="Transaction date"
          required
          value={template.transactionDate}
          onChange={(value) => onPatchTemplate({ transactionDate: value ?? '' })}
          disabled={pending}
          error={errors['template.transactionDate'] ?? errors.transactionDate}
        />
        <TextField
          label="Reference number"
          optional
          value={template.referenceNumber ?? ''}
          onChange={(value) => onPatchTemplate({ referenceNumber: value })}
          disabled={pending}
          error={errors['template.referenceNumber'] ?? errors.referenceNumber}
        />
        <TextField
          label="Comment"
          required
          multiline
          rows={2}
          value={template.comments ?? ''}
          onChange={(value) => onPatchTemplate({ comments: value })}
          disabled={pending}
          error={errors['template.comments'] ?? errors.comments}
        />
      </div>

      {selectedIneligibleReason ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {selectedIneligibleReason} Use single-entry create or Excel import instead.
        </p>
      ) : null}

      {ruleSummary ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">Template GL lines</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Debits
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {ruleSummary.debits.map((account) => (
                  <li key={`debit-${account.id}`}>{formatJournalEntryGlAccountLabel(account)}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Credits
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {ruleSummary.credits.map((account) => (
                  <li key={`credit-${account.id}`}>{formatJournalEntryGlAccountLabel(account)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

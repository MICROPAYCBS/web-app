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
import { currencySelectOptions, postingTemplateSelectOptions, postingTemplateSelectValue } from '@/lib/accounting/journal-entry-display';
import type { JournalEntryStepProps } from '../types';

export function DetailsStep({
  form,
  errors,
  pending,
  onPatch,
  offices,
  currencies,
  departments,
  accountingRules,
  validationContext,
  onPostingTemplateChange
}: JournalEntryStepProps) {
  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: office.name ?? office.nameDecorated ?? String(office.id)
      })),
    [offices]
  );

  const postingTemplateOptions = useMemo(
    () => postingTemplateSelectOptions(accountingRules),
    [accountingRules]
  );

  const departmentOptions = useMemo(() => {
    const officeId = form.officeId > 0 ? form.officeId : undefined;
    return departments
      .filter((department) => department.active !== false)
      .filter(
        (department) =>
          department.officeId == null || officeId == null || department.officeId === officeId
      )
      .map((department) => ({
        value: String(department.id),
        label: department.departmentName,
        keywords: [department.departmentCode]
      }));
  }, [departments, form.officeId]);

  const departmentRequired = useMemo(() => {
    if (!validationContext.requireDepartmentOnPlLines) {
      return false;
    }
    const types = validationContext.glAccountTypesById ?? {};
    return [...form.debits, ...form.credits].some((line) => {
      const typeId = types[line.glAccountId];
      return typeId === 4 || typeId === 5;
    });
  }, [form.debits, form.credits, validationContext]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Choose where and when to post, and optionally start from a posting template.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Branch"
          required
          value={form.officeId > 0 ? String(form.officeId) : undefined}
          onValueChange={(value) => {
            if (!value) {
              return;
            }
            const officeId = Number(value);
            const patch: Partial<typeof form> = { officeId };
            if (form.departmentId != null) {
              const department = departments.find((row) => row.id === form.departmentId);
              if (department?.officeId != null && department.officeId !== officeId) {
                patch.departmentId = undefined;
              }
            }
            onPatch(patch);
          }}
          options={officeOptions}
          placeholder="Select branch"
          disabled={pending}
          error={errors.officeId}
        />
        <SelectField
          label="Department"
          optional={!departmentRequired}
          required={departmentRequired}
          value={form.departmentId != null ? String(form.departmentId) : undefined}
          onValueChange={(value) => onPatch({ departmentId: value ? Number(value) : undefined })}
          options={departmentOptions}
          placeholder="None"
          disabled={pending}
          error={errors.departmentId}
        />
        <SelectField
          label="Posting template"
          optional
          value={postingTemplateSelectValue(form.accountingRule)}
          onValueChange={onPostingTemplateChange}
          options={postingTemplateOptions}
          disabled={pending}
          error={errors.accountingRule}
          hint="Choose Manual entry to add multiple debit and credit lines. Select an accounting rule to pre-fill GL accounts from a template."
        />
        <SelectField
          label="Currency"
          required
          value={form.currencyCode || undefined}
          onValueChange={(value) => {
            if (value) {
              onPatch({ currencyCode: value });
            }
          }}
          options={currencySelectOptions(currencies)}
          placeholder="Select currency"
          disabled={pending}
          error={errors.currencyCode}
        />
        <TransactionDateField
          label="Transaction date"
          required
          value={form.transactionDate}
          onChange={(value) => onPatch({ transactionDate: value ?? '' })}
          disabled={pending}
          error={errors.transactionDate}
        />
        <TextField
          label="Reference number"
          optional
          value={form.referenceNumber ?? ''}
          onChange={(value) => onPatch({ referenceNumber: value })}
          disabled={pending}
          error={errors.referenceNumber}
        />
      </div>
    </div>
  );
}

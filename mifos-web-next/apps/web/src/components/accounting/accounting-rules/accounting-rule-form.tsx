'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAccountingRuleFormTemplate } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateUpsertAccountingRuleForm,
  type AccountingRuleSideType,
  type UpsertAccountingRuleFormInput
} from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createAccountingRuleAction,
  updateAccountingRuleAction
} from '@/actions/accounting-rules';
import { FormLabel } from '@/components/composites/form-label';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatAccountingRuleAccountLabel } from '@/lib/accounting/accounting-rule-display';
import { cn } from '@/lib/utils';

function TagMultiSelect({
  label,
  required = false,
  options,
  value,
  onChange,
  error,
  disabled = false
}: {
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FormLabel required={required}>{label}</FormLabel>
      <FieldContent>
        <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {options.length ? (
            options.map((option) => {
              const id = Number(option.value);
              const checked = value.includes(id);
              return (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) => {
                      if (next === true) {
                        onChange([...value, id]);
                        return;
                      }
                      onChange(value.filter((entry) => entry !== id));
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No tags available.</p>
          )}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}

function RuleTypeToggle({
  label,
  value,
  onChange,
  disabled = false
}: {
  label: string;
  value: AccountingRuleSideType;
  onChange: (value: AccountingRuleSideType) => void;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FormLabel required>{label}</FormLabel>
      <FieldContent>
        <ToggleGroup
          value={[value]}
          onValueChange={(values) => {
            const next = values[0];
            if (next === 'fixedAccount' || next === 'listOfAccounts') {
              onChange(next);
            }
          }}
          variant="outline"
          size="sm"
          spacing={0}
          disabled={disabled}
          aria-label={label}
        >
          <ToggleGroupItem value="fixedAccount">Fixed account</ToggleGroupItem>
          <ToggleGroupItem value="listOfAccounts">List of accounts</ToggleGroupItem>
        </ToggleGroup>
      </FieldContent>
    </Field>
  );
}

export function AccountingRuleForm({
  mode,
  accountingRuleId,
  initialValues,
  template
}: {
  mode: 'create' | 'edit';
  accountingRuleId?: number;
  initialValues: UpsertAccountingRuleFormInput;
  template: FineractAccountingRuleFormTemplate;
}) {
  const router = useRouter();
  const [form, setForm] = useState<UpsertAccountingRuleFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const officeOptions = useMemo(
    () =>
      template.allowedOffices.map((office) => ({
        value: String(office.id),
        label: office.name ?? office.nameDecorated ?? String(office.id)
      })),
    [template.allowedOffices]
  );

  const accountOptions = useMemo(
    () =>
      template.allowedAccounts.map((account) => ({
        value: String(account.id),
        label: formatAccountingRuleAccountLabel(account),
        keywords: [account.glCode, account.name].filter((keyword): keyword is string =>
          Boolean(keyword)
        )
      })),
    [template.allowedAccounts]
  );

  const debitTagOptions = useMemo(
    () =>
      template.allowedDebitTagOptions.map((tag) => ({
        value: String(tag.id),
        label: tag.name
      })),
    [template.allowedDebitTagOptions]
  );

  const creditTagOptions = useMemo(
    () =>
      template.allowedCreditTagOptions.map((tag) => ({
        value: String(tag.id),
        label: tag.name
      })),
    [template.allowedCreditTagOptions]
  );

  function patchForm(patch: Partial<UpsertAccountingRuleFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertAccountingRuleFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handleDebitRuleTypeChange(debitRuleType: AccountingRuleSideType) {
    if (debitRuleType === 'fixedAccount') {
      patchForm({
        debitRuleType,
        debitTags: [],
        allowMultipleDebitEntries: false
      });
      return;
    }
    patchForm({
      debitRuleType,
      accountToDebit: undefined
    });
  }

  function handleCreditRuleTypeChange(creditRuleType: AccountingRuleSideType) {
    if (creditRuleType === 'fixedAccount') {
      patchForm({
        creditRuleType,
        creditTags: [],
        allowMultipleCreditEntries: false
      });
      return;
    }
    patchForm({
      creditRuleType,
      accountToCredit: undefined
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateUpsertAccountingRuleForm(formRef.current);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      setSubmitError('Fix the highlighted fields.');
      return;
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createAccountingRuleAction(parsed.data)
          : await updateAccountingRuleAction(accountingRuleId as number, parsed.data);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }

      toast.success(mode === 'create' ? 'Accounting rule created.' : 'Accounting rule updated.');
      router.push(`/accounting/accounting-rules/${result.resourceId ?? accountingRuleId}`);
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Rule name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          disabled={pending}
          error={fieldErrors.name}
        />
        <SelectField
          label="Branch"
          required
          value={form.officeId > 0 ? String(form.officeId) : undefined}
          onValueChange={(value) => {
            if (value) {
              patchForm({ officeId: Number(value) });
            }
          }}
          options={officeOptions}
          placeholder="Select branch"
          disabled={pending}
          error={fieldErrors.officeId}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium">Debit entry</h3>
        <RuleTypeToggle
          label="Debit rule type"
          value={form.debitRuleType}
          onChange={handleDebitRuleTypeChange}
          disabled={pending}
        />
        {form.debitRuleType === 'fixedAccount' ? (
          <SelectField
            label="Account to debit"
            required
            value={form.accountToDebit ? String(form.accountToDebit) : undefined}
            onValueChange={(value) => patchForm({ accountToDebit: value ? Number(value) : undefined })}
            options={accountOptions}
            placeholder="Select account"
            disabled={pending}
            error={fieldErrors.accountToDebit}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <TagMultiSelect
              label="Debit tags"
              required
              options={debitTagOptions}
              value={form.debitTags ?? []}
              onChange={(debitTags) => patchForm({ debitTags })}
              error={fieldErrors.debitTags}
              disabled={pending}
            />
            <Field>
              <FormLabel optional>Multiple debit entries</FormLabel>
              <FieldContent>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.allowMultipleDebitEntries ?? false}
                    disabled={pending}
                    onCheckedChange={(checked) =>
                      patchForm({ allowMultipleDebitEntries: checked === true })
                    }
                  />
                  Allow multiple debit entries
                </label>
              </FieldContent>
            </Field>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <h3 className="text-sm font-medium">Credit entry</h3>
        <RuleTypeToggle
          label="Credit rule type"
          value={form.creditRuleType}
          onChange={handleCreditRuleTypeChange}
          disabled={pending}
        />
        {form.creditRuleType === 'fixedAccount' ? (
          <SelectField
            label="Account to credit"
            required
            value={form.accountToCredit ? String(form.accountToCredit) : undefined}
            onValueChange={(value) => patchForm({ accountToCredit: value ? Number(value) : undefined })}
            options={accountOptions}
            placeholder="Select account"
            disabled={pending}
            error={fieldErrors.accountToCredit}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <TagMultiSelect
              label="Credit tags"
              required
              options={creditTagOptions}
              value={form.creditTags ?? []}
              onChange={(creditTags) => patchForm({ creditTags })}
              error={fieldErrors.creditTags}
              disabled={pending}
            />
            <Field>
              <FormLabel optional>Multiple credit entries</FormLabel>
              <FieldContent>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.allowMultipleCreditEntries ?? false}
                    disabled={pending}
                    onCheckedChange={(checked) =>
                      patchForm({ allowMultipleCreditEntries: checked === true })
                    }
                  />
                  Allow multiple credit entries
                </label>
              </FieldContent>
            </Field>
          </div>
        )}
      </div>

      <TextField
        label="Description"
        optional
        multiline
        rows={3}
        value={form.description ?? ''}
        onChange={(value) => patchForm({ description: value })}
        disabled={pending}
        error={fieldErrors.description}
      />

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={
            mode === 'edit' && accountingRuleId
              ? `/accounting/accounting-rules/${accountingRuleId}`
              : '/accounting/accounting-rules'
          }
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}

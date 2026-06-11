'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAccountingRuleGlAccountRef,
  FineractAccountingRuleListItem,
  FineractCurrencyOption,
  FineractOfficeOption,
  FineractPaymentTypeOption
} from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateCreateFrequentPostingForm,
  type CreateFrequentPostingFormInput,
  type JournalEntryLineInput
} from '@mifos/validation';
import { Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { parseAmount, areJournalEntryTotalsBalanced } from '@mifos/domain';
import { createFrequentPostingAction } from '@/actions/frequent-postings';
import { JournalEntryTotalsSummary } from '@/components/accounting/journal-entry-totals-summary';
import { DateField } from '@/components/composites/date-field';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { currencySelectOptions } from '@/lib/accounting/journal-entry-display';
import {
  emptyFrequentPostingLine,
  formatFrequentPostingAccountLabel,
  frequentPostingLinesForRule
} from '@/lib/accounting/frequent-posting-display';
import { cn } from '@/lib/utils';

function parseLineAmount(value: string): number {
  const decimal = parseAmount(value);
  return decimal ? decimal.toNumber() : 0;
}

function FrequentPostingLinesEditor({
  label,
  lines,
  fieldPrefix,
  accounts,
  allowMultiple,
  currencyCode,
  fieldErrors,
  pending,
  onChange
}: {
  label: string;
  lines: JournalEntryLineInput[];
  fieldPrefix: 'debits' | 'credits';
  accounts: FineractAccountingRuleGlAccountRef[];
  allowMultiple: boolean;
  currencyCode: string;
  fieldErrors: Record<string, string>;
  pending: boolean;
  onChange: (lines: JournalEntryLineInput[]) => void;
}) {
  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        value: String(account.id),
        label: formatFrequentPostingAccountLabel(account),
        keywords: [account.glCode, account.name]
      })),
    [accounts]
  );

  function patchLine(index: number, patch: Partial<JournalEntryLineInput>) {
    onChange(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    onChange([...lines, emptyFrequentPostingLine()]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) {
      return;
    }
    onChange(lines.filter((_, lineIndex) => lineIndex !== index));
  }

  if (!lines.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{label}</h3>
        {allowMultiple ? (
          <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={pending}>
            <Plus className="mr-2 size-4" />
            Add line
          </Button>
        ) : null}
      </div>
      <div className="space-y-3">
        {lines.map((line, index) => (
          <div
            key={`${fieldPrefix}-${index}`}
            className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_minmax(200px,240px)_auto]"
          >
            <SelectField
              label="GL account"
              required
              value={line.glAccountId > 0 ? String(line.glAccountId) : undefined}
              onValueChange={(value) => {
                if (value) {
                  patchLine(index, { glAccountId: Number(value) });
                }
              }}
              options={accountOptions}
              placeholder="Select account"
              disabled={pending || !accounts.length}
              error={fieldErrors[`${fieldPrefix}.${index}.glAccountId`]}
            />
            <MoneyField
              label="Amount"
              required
              currencyCode={currencyCode}
              value={line.amount > 0 ? String(line.amount) : ''}
              onChange={(value) => patchLine(index, { amount: parseLineAmount(value) })}
              disabled={pending}
              error={fieldErrors[`${fieldPrefix}.${index}.amount`]}
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeLine(index)}
                disabled={pending || lines.length <= 1 || !allowMultiple}
                aria-label={`Remove ${label.toLowerCase()} line ${index + 1}`}
              >
                <Minus className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {fieldErrors[fieldPrefix] ? (
        <p className="text-sm text-destructive">{fieldErrors[fieldPrefix]}</p>
      ) : null}
    </div>
  );
}

export function FrequentPostingsForm({
  initialValues,
  offices,
  currencies,
  paymentTypes,
  accountingRules
}: {
  initialValues: CreateFrequentPostingFormInput;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  paymentTypes: FineractPaymentTypeOption[];
  accountingRules: FineractAccountingRuleListItem[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<CreateFrequentPostingFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [debitAccounts, setDebitAccounts] = useState<FineractAccountingRuleGlAccountRef[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<FineractAccountingRuleGlAccountRef[]>([]);
  const [allowMultipleDebitEntries, setAllowMultipleDebitEntries] = useState(false);
  const [allowMultipleCreditEntries, setAllowMultipleCreditEntries] = useState(false);

  const officeOptions = useMemo(
    () =>
      offices.map((office) => ({
        value: String(office.id),
        label: office.name ?? office.nameDecorated ?? String(office.id)
      })),
    [offices]
  );

  const accountingRuleOptions = useMemo(
    () =>
      accountingRules.map((rule) => ({
        value: String(rule.id),
        label: rule.name
      })),
    [accountingRules]
  );

  const paymentTypeOptions = useMemo(
    () =>
      paymentTypes.map((paymentType) => ({
        value: String(paymentType.id),
        label: paymentType.name
      })),
    [paymentTypes]
  );

  const selectedRule = useMemo(
    () => accountingRules.find((rule) => rule.id === form.accountingRule),
    [accountingRules, form.accountingRule]
  );

  const isBalanced = useMemo(
    () => areJournalEntryTotalsBalanced(form.debits, form.credits),
    [form.debits, form.credits]
  );

  function patchForm(patch: Partial<CreateFrequentPostingFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as CreateFrequentPostingFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handleAccountingRuleChange(value: string | undefined) {
    if (!value) {
      return;
    }
    const ruleId = Number(value);
    const rule = accountingRules.find((entry) => entry.id === ruleId);
    if (!rule) {
      return;
    }
    const lineState = frequentPostingLinesForRule(rule);
    setDebitAccounts(lineState.debitAccounts);
    setCreditAccounts(lineState.creditAccounts);
    setAllowMultipleDebitEntries(lineState.allowMultipleDebitEntries);
    setAllowMultipleCreditEntries(lineState.allowMultipleCreditEntries);
    patchForm({
      accountingRule: ruleId,
      debits: lineState.debits,
      credits: lineState.credits
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateCreateFrequentPostingForm(formRef.current);
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
      const result = await createFrequentPostingAction(parsed.data);
      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast.error(result.message);
        return;
      }

      toast.success('Frequent posting created.');
      if (result.transactionId) {
        router.push(`/accounting/journal-entries/transactions/${result.transactionId}`);
      } else {
        router.push('/accounting/journal-entries');
      }
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
        <SelectField
          label="Accounting rule"
          required
          value={form.accountingRule > 0 ? String(form.accountingRule) : undefined}
          onValueChange={handleAccountingRuleChange}
          options={accountingRuleOptions}
          placeholder="Select accounting rule"
          disabled={pending}
          error={fieldErrors.accountingRule}
        />
        <SelectField
          label="Currency"
          required
          value={form.currencyCode || undefined}
          onValueChange={(value) => {
            if (value) {
              patchForm({ currencyCode: value });
            }
          }}
          options={currencySelectOptions(currencies)}
          placeholder="Select currency"
          disabled={pending}
          error={fieldErrors.currencyCode}
        />
        <DateField
          label="Transaction date"
          required
          value={form.transactionDate}
          onChange={(value) => patchForm({ transactionDate: value ?? '' })}
          disabled={pending}
          error={fieldErrors.transactionDate}
        />
        <TextField
          label="Reference number"
          optional
          value={form.referenceNumber ?? ''}
          onChange={(value) => patchForm({ referenceNumber: value })}
          disabled={pending}
        />
      </div>

      {selectedRule ? (
        <>
          <FrequentPostingLinesEditor
            label="Debits"
            lines={form.debits}
            fieldPrefix="debits"
            accounts={debitAccounts}
            allowMultiple={allowMultipleDebitEntries}
            currencyCode={form.currencyCode}
            fieldErrors={fieldErrors}
            pending={pending}
            onChange={(debits) => patchForm({ debits })}
          />
          <FrequentPostingLinesEditor
            label="Credits"
            lines={form.credits}
            fieldPrefix="credits"
            accounts={creditAccounts}
            allowMultiple={allowMultipleCreditEntries}
            currencyCode={form.currencyCode}
            fieldErrors={fieldErrors}
            pending={pending}
            onChange={(credits) => patchForm({ credits })}
          />
          <JournalEntryTotalsSummary
            debits={form.debits}
            credits={form.credits}
            currencyCode={form.currencyCode}
            error={fieldErrors.balance}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select an accounting rule to configure debit and credit lines.
        </p>
      )}

      <Collapsible open={paymentOpen} onOpenChange={setPaymentOpen}>
        <CollapsibleTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              {paymentOpen ? 'Hide payment details' : 'Add payment details'}
            </Button>
          }
        />
        <CollapsibleContent className="mt-4 space-y-4 rounded-lg border border-border p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Payment type"
              optional
              value={form.paymentTypeId ? String(form.paymentTypeId) : undefined}
              onValueChange={(value) =>
                patchForm({ paymentTypeId: value ? Number(value) : undefined })
              }
              options={paymentTypeOptions}
              placeholder="Select payment type"
              disabled={pending}
            />
            <TextField
              label="Account number"
              optional
              value={form.accountNumber ?? ''}
              onChange={(value) => patchForm({ accountNumber: value })}
              disabled={pending}
            />
            <TextField
              label="Cheque number"
              optional
              value={form.checkNumber ?? ''}
              onChange={(value) => patchForm({ checkNumber: value })}
              disabled={pending}
            />
            <TextField
              label="Routing code"
              optional
              value={form.routingCode ?? ''}
              onChange={(value) => patchForm({ routingCode: value })}
              disabled={pending}
            />
            <TextField
              label="Receipt number"
              optional
              value={form.receiptNumber ?? ''}
              onChange={(value) => patchForm({ receiptNumber: value })}
              disabled={pending}
            />
            <TextField
              label="Bank number"
              optional
              value={form.bankNumber ?? ''}
              onChange={(value) => patchForm({ bankNumber: value })}
              disabled={pending}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <TextField
        label="Comments"
        optional
        multiline
        rows={3}
        value={form.comments ?? ''}
        onChange={(value) => patchForm({ comments: value })}
        disabled={pending}
      />

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/accounting/journal-entries"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending || !selectedRule || !isBalanced}>
          {pending ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}

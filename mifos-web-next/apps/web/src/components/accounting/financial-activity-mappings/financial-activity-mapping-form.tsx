'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFinancialActivityMappingFormTemplate } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateUpsertFinancialActivityMappingForm,
  type UpsertFinancialActivityMappingFormInput
} from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import {
  createFinancialActivityMappingAction,
  updateFinancialActivityMappingAction
} from '@/actions/financial-activity-mappings';
import { SelectField } from '@/components/composites/select-field';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  financialActivityGlAccountSelectOptions,
  financialActivitySelectOptions,
  glAccountsForFinancialActivity
} from '@/lib/accounting/financial-activity-mapping-display';
import { cn } from '@/lib/utils';

export function FinancialActivityMappingForm({
  mode,
  mappingId,
  initialValues,
  template
}: {
  mode: 'create' | 'edit';
  mappingId?: number;
  initialValues: UpsertFinancialActivityMappingFormInput;
  template: FineractFinancialActivityMappingFormTemplate;
}) {
  const router = useRouter();
  const [form, setForm] = useState<UpsertFinancialActivityMappingFormInput>(initialValues);
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const financialActivityOptions = useMemo(
    () => financialActivitySelectOptions(template.financialActivityOptions),
    [template.financialActivityOptions]
  );

  const glAccountOptions = useMemo(() => {
    const accounts = form.financialActivityId
      ? glAccountsForFinancialActivity(form.financialActivityId, template.glAccountOptions)
      : [];
    return financialActivityGlAccountSelectOptions(accounts);
  }, [form.financialActivityId, template.glAccountOptions]);

  function patchForm(patch: Partial<UpsertFinancialActivityMappingFormInput>) {
    setForm((current) => {
      const next = { ...current, ...patch } as UpsertFinancialActivityMappingFormInput;
      formRef.current = next;
      return next;
    });
  }

  function handleFinancialActivityChange(value: string | undefined) {
    if (!value) {
      return;
    }
    const financialActivityId = Number(value);
    const accounts = glAccountsForFinancialActivity(financialActivityId, template.glAccountOptions);
    const glAccountStillValid = accounts.some((account) => account.id === formRef.current.glAccountId);
    patchForm({
      financialActivityId,
      glAccountId: glAccountStillValid ? formRef.current.glAccountId : 0
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    const parsed = validateUpsertFinancialActivityMappingForm(formRef.current);
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
          ? await createFinancialActivityMappingAction(parsed.data)
          : await updateFinancialActivityMappingAction(mappingId!, parsed.data);

      if (!result.ok) {

        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: mode === 'create'
          ? 'Financial activity mapping created.'
          : 'Financial activity mapping updated.', pending: mode === 'create'
          ? 'Financial activity mapping created.'
          : 'Financial activity mapping updated.' });
      router.push(`/accounting/financial-activity-mappings/${result.resourceId ?? mappingId}`);
      router.refresh();
    });
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Financial activity"
          required
          value={form.financialActivityId > 0 ? String(form.financialActivityId) : undefined}
          onValueChange={handleFinancialActivityChange}
          options={financialActivityOptions}
          placeholder="Select financial activity"
          disabled={pending}
          error={fieldErrors.financialActivityId}
        />
        <SelectField
          label="GL account"
          required
          value={form.glAccountId > 0 ? String(form.glAccountId) : undefined}
          onValueChange={(value) => {
            if (value) {
              patchForm({ glAccountId: Number(value) });
            }
          }}
          options={glAccountOptions}
          placeholder={
            form.financialActivityId > 0 ? 'Select GL account' : 'Select a financial activity first'
          }
          disabled={pending || form.financialActivityId <= 0}
          emptyMessage="No GL accounts available for this activity."
          error={fieldErrors.glAccountId}
        />
      </div>

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={
            mode === 'edit' && mappingId
              ? `/accounting/financial-activity-mappings/${mappingId}`
              : '/accounting/financial-activity-mappings'
          }
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? 'Submitting…' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}

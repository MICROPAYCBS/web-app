'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractFinancialActivityMappingFormTemplate,
  FineractFinancialActivityMappingListItem
} from '@mifos/api-client';
import {
  formatActionErrorMessage,
  validateUpsertFinancialActivityMappingForm,
  type UpsertFinancialActivityMappingFormInput
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import {
  createFinancialActivityMappingAction,
  updateFinancialActivityMappingAction
} from '@/actions/financial-activity-mappings';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import {
  availableFinancialActivitiesForMapping,
  defaultFinancialActivityMappingFormValues,
  financialActivityGlAccountSelectOptions,
  financialActivityMappingFormValuesFromDetail,
  financialActivitySelectOptions,
  glAccountsForFinancialActivity,
  mappedFinancialActivityIds
} from '@/lib/accounting/financial-activity-mapping-display';

export function FinancialActivityMappingFormSheet({
  open,
  onOpenChange,
  mode,
  template,
  mapping,
  existingMappings = []
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  template: FineractFinancialActivityMappingFormTemplate;
  mapping?: FineractFinancialActivityMappingListItem;
  existingMappings?: FineractFinancialActivityMappingListItem[];
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<UpsertFinancialActivityMappingFormInput>(() =>
    mapping
      ? financialActivityMappingFormValuesFromDetail(mapping)
      : defaultFinancialActivityMappingFormValues()
  );
  const formRef = useRef(form);
  formRef.current = form;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mappedActivityIds = useMemo(
    () => mappedFinancialActivityIds(existingMappings),
    [existingMappings]
  );

  const financialActivityOptions = useMemo(() => {
    const activities = availableFinancialActivitiesForMapping(
      template.financialActivityOptions,
      mappedActivityIds,
      mode === 'edit' ? { includeActivityId: mapping?.financialActivityData.id } : undefined
    );
    return financialActivitySelectOptions(activities);
  }, [
    mappedActivityIds,
    mode,
    mapping?.financialActivityData.id,
    template.financialActivityOptions
  ]);

  const glAccountOptions = useMemo(() => {
    const accounts = form.financialActivityId
      ? glAccountsForFinancialActivity(form.financialActivityId, template.glAccountOptions)
      : [];
    return financialActivityGlAccountSelectOptions(accounts);
  }, [form.financialActivityId, template.glAccountOptions]);

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setForm(
        mapping
          ? financialActivityMappingFormValuesFromDetail(mapping)
          : defaultFinancialActivityMappingFormValues()
      );
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

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
          : await updateFinancialActivityMappingAction(mapping!.id, parsed.data);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toastCommandOutcome(result, {
        completed:
          mode === 'create'
            ? 'Financial activity mapping created.'
            : 'Financial activity mapping updated.',
        pending:
          mode === 'create'
            ? 'Financial activity mapping creation sent for approval.'
            : 'Financial activity mapping update sent for approval.'
      });
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Define mapping' : 'Edit mapping'}
      description="Link a financial activity to a GL account for automated accounting transfers."
      formId={formId}
      submitLabel={mode === 'create' ? 'Create mapping' : 'Save changes'}
      submitLoading={pending}
      error={submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null}
    >
      <form id={formId} className="grid gap-4" onSubmit={handleSubmit}>
        <SelectField
          id={`${formId}-financial-activity`}
          label="Financial activity"
          required
          value={form.financialActivityId > 0 ? String(form.financialActivityId) : undefined}
          onValueChange={handleFinancialActivityChange}
          options={financialActivityOptions}
          placeholder="Select financial activity"
          disabled={pending}
          emptyMessage={
            mode === 'create' && financialActivityOptions.length === 0
              ? 'All financial activities are already mapped.'
              : 'No financial activities available.'
          }
          error={fieldErrors.financialActivityId}
        />
        <SelectField
          id={`${formId}-gl-account`}
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
      </form>
    </FormSheet>
  );
}

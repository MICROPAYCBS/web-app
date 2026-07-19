'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { TaxComponentDetail, TaxComponentTemplate } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import {
  createTaxComponentAction,
  updateTaxComponentAction
} from '@/actions/tax-component';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  formatTaxAccountType,
  formatTaxGlAccount,
  glAccountsForTaxComponentType,
  taxComponentTypeSelectOptions,
  taxDateToFormString,
  taxGlAccountSelectOptions
} from '@/lib/fineract/tax-display';
import {
  taxComponentDetailPath,
  taxComponentsListPath
} from '@/lib/fineract/tax-paths';

export const CREATE_TAX_COMPONENT_FORM_ID = 'create-tax-component-form';
export const EDIT_TAX_COMPONENT_FORM_ID = 'edit-tax-component-form';

export function TaxComponentCreateSheet({
  template,
  open,
  onOpenChange
}: {
  template: TaxComponentTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [debitAccountType, setDebitAccountType] = useState<string | undefined>();
  const [debitAccountId, setDebitAccountId] = useState<string | undefined>();
  const [creditAccountType, setCreditAccountType] = useState<string | undefined>();
  const [creditAccountId, setCreditAccountId] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const accountTypeOptions = useMemo(
    () => taxComponentTypeSelectOptions(template),
    [template]
  );
  const debitAccounts = useMemo(
    () =>
      taxGlAccountSelectOptions(
        glAccountsForTaxComponentType(
          debitAccountType ? Number(debitAccountType) : undefined,
          template.glAccountOptions
        )
      ),
    [debitAccountType, template.glAccountOptions]
  );
  const creditAccounts = useMemo(
    () =>
      taxGlAccountSelectOptions(
        glAccountsForTaxComponentType(
          creditAccountType ? Number(creditAccountType) : undefined,
          template.glAccountOptions
        )
      ),
    [creditAccountType, template.glAccountOptions]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setName('');
    setPercentage('');
    setDebitAccountType(undefined);
    setDebitAccountId(undefined);
    setCreditAccountType(undefined);
    setCreditAccountId(undefined);
    setStartDate(undefined);
    setFieldErrors({});
    setSubmitError(null);
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createTaxComponentAction({
        name,
        percentage,
        debitAccountType,
        debitAccountId,
        creditAccountType,
        creditAccountId,
        startDate: startDate ?? ''
      });

      if (!result.ok) {

        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Tax component created.', pending: 'Tax component created sent for approval.' });
      onOpenChange(false);
      const id = result.resourceId;
      router.push(id ? taxComponentDetailPath(id) : taxComponentsListPath());
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create tax component"
      description="Define the rate, ledger accounts, and effective start date."
      formId={CREATE_TAX_COMPONENT_FORM_ID}
      submitLabel="Create"
      submitLoading={pending}
    >
      {submitError ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}
      <form id={CREATE_TAX_COMPONENT_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Name"
          required
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          disabled={pending}
        />
        <NumericField
          label="Percentage"
          required
          value={percentage}
          onChange={setPercentage}
          error={fieldErrors.percentage}
          disabled={pending}
        />
        <SelectField
          label="Debit account type"
          value={debitAccountType}
          onValueChange={(value) => {
            setDebitAccountType(value);
            setDebitAccountId(undefined);
          }}
          options={accountTypeOptions}
          placeholder="Select account type"
          disabled={pending}
        />
        {debitAccountType ? (
          <SelectField
            label="Debit account"
            value={debitAccountId}
            onValueChange={setDebitAccountId}
            options={debitAccounts}
            placeholder="Select account"
            error={fieldErrors.debitAccountId}
            disabled={pending}
          />
        ) : null}
        <SelectField
          label="Credit account type"
          value={creditAccountType}
          onValueChange={(value) => {
            setCreditAccountType(value);
            setCreditAccountId(undefined);
          }}
          options={accountTypeOptions}
          placeholder="Select account type"
          disabled={pending}
        />
        {creditAccountType ? (
          <SelectField
            label="Credit account"
            value={creditAccountId}
            onValueChange={setCreditAccountId}
            options={creditAccounts}
            placeholder="Select account"
            error={fieldErrors.creditAccountId}
            disabled={pending}
          />
        ) : null}
        <DateField
          label="Start date"
          required
          value={startDate}
          onChange={setStartDate}
          error={fieldErrors.startDate}
          disabled={pending}
          allowFuture
        />
      </form>
    </FormSheet>
  );
}

export function TaxComponentEditSheet({
  component,
  open,
  onOpenChange
}: {
  component: TaxComponentDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(component.name ?? '');
  const [percentage, setPercentage] = useState(
    component.percentage !== undefined ? String(component.percentage) : ''
  );
  const [startDate, setStartDate] = useState<string | undefined>(
    taxDateToFormString(component.startDate)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(component.name ?? '');
    setPercentage(component.percentage !== undefined ? String(component.percentage) : '');
    setStartDate(taxDateToFormString(component.startDate));
    setFieldErrors({});
    setSubmitError(null);
  }, [open, component]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateTaxComponentAction(String(component.id), {
        name,
        percentage,
        startDate: startDate ?? ''
      });

      if (!result.ok) {

        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Tax component updated.', pending: 'Tax component updated sent for approval.' });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit tax component"
      description={component.name ?? 'Update tax component details.'}
      formId={EDIT_TAX_COMPONENT_FORM_ID}
      submitLabel="Save changes"
      submitLoading={pending}
    >
      {submitError ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      ) : null}
      <form id={EDIT_TAX_COMPONENT_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Name"
          required
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          disabled={pending}
        />
        <NumericField
          label="Percentage"
          required
          value={percentage}
          onChange={setPercentage}
          error={fieldErrors.percentage}
          disabled={pending}
        />
        <TextField
          label="Debit account type"
          value={formatTaxAccountType(component.debitAccountType)}
          onChange={() => undefined}
          disabled
        />
        <TextField
          label="Debit account"
          value={formatTaxGlAccount(component.debitAccount)}
          onChange={() => undefined}
          disabled
        />
        <TextField
          label="Credit account type"
          value={formatTaxAccountType(component.creditAccountType)}
          onChange={() => undefined}
          disabled
        />
        <TextField
          label="Credit account"
          value={formatTaxGlAccount(component.creditAccount)}
          onChange={() => undefined}
          disabled
        />
        <DateField
          label="Start date"
          required
          value={startDate}
          onChange={setStartDate}
          error={fieldErrors.startDate}
          disabled={pending}
          allowFuture
        />
      </form>
    </FormSheet>
  );
}

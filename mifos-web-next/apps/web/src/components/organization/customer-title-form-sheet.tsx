'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerTitle, CustomerTitleTemplate } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  type CustomerTitleUpdateClearFields,
  type UpdateCustomerTitleInput,
  type UpsertCustomerTitleInput
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createCustomerTitleAction, updateCustomerTitleAction } from '@/actions/customer-title';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';

type CustomerTitleFormState = {
  titleCode: string;
  titleName: string;
  genderId: string;
  displayOrder: string;
  status: string;
};

function defaultFormState(): CustomerTitleFormState {
  return {
    titleCode: '',
    titleName: '',
    genderId: '',
    displayOrder: '',
    status: 'ACTIVE'
  };
}

function formStateFromCustomerTitle(customerTitle: CustomerTitle): CustomerTitleFormState {
  return {
    titleCode: customerTitle.titleCode,
    titleName: customerTitle.titleName,
    genderId: customerTitle.genderId != null ? String(customerTitle.genderId) : '',
    displayOrder: customerTitle.displayOrder != null ? String(customerTitle.displayOrder) : '',
    status: customerTitle.status ?? 'ACTIVE'
  };
}

function toOptions(values: string[]) {
  return values.map((value) => ({ value, label: value.replaceAll('_', ' ') }));
}

function buildSubmitInput(form: CustomerTitleFormState): UpsertCustomerTitleInput {
  return {
    titleCode: form.titleCode,
    titleName: form.titleName,
    genderId: form.genderId ? (Number(form.genderId) as 1 | 2) : null,
    displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
    status: form.status as UpsertCustomerTitleInput['status']
  };
}

function buildClearFields(
  form: CustomerTitleFormState,
  initial?: CustomerTitle
): CustomerTitleUpdateClearFields {
  return {
    genderId: initial != null && initial.genderId != null && form.genderId === '',
    displayOrder: initial != null && initial.displayOrder != null && form.displayOrder === ''
  };
}

export function CustomerTitleFormSheet({
  open,
  onOpenChange,
  mode,
  customerTitle,
  template
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  customerTitle?: CustomerTitle;
  template: CustomerTitleTemplate;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<CustomerTitleFormState>(defaultFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setForm(
      mode === 'edit' && customerTitle ? formStateFromCustomerTitle(customerTitle) : defaultFormState()
    );
  }, [open, mode, customerTitle]);

  const genderOptions = [
    { value: '', label: 'Neutral (any gender)' },
    ...template.genderOptions.map((option) => ({
      value: String(option.id),
      label: option.name
    }))
  ];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    const input = buildSubmitInput(form);

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createCustomerTitleAction(input);
        if (!result.ok) {
          setFormError(formatActionErrorMessage(result.message, result.fieldErrors));
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          return;
        }
        toastCommandOutcome(result, { completed: 'Customer title created.', pending: 'Customer title creation sent for approval.' });
        onOpenChange(false);
        router.refresh();
        return;
      }

      if (!customerTitle) {
        return;
      }

      const clear = buildClearFields(form, customerTitle);
      const result = await updateCustomerTitleAction(
        customerTitle.id,
        input as UpdateCustomerTitleInput,
        clear
      );
      if (!result.ok) {
        setFormError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      toastCommandOutcome(result, { completed: 'Customer title updated.', pending: 'Customer title update sent for approval.' });
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Create customer title' : 'Edit customer title'}
      description="Extend the title list for customer biodata. Neutral titles apply to any gender; gender-specific titles are filtered on client forms."
      formId={formId}
      submitLoading={pending}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {formError ? <FormErrorAlert>{formError}</FormErrorAlert> : null}
        <TextField
          label="Title code"
          value={form.titleCode}
          onChange={(value) => setForm((current) => ({ ...current, titleCode: value }))}
          error={fieldErrors.titleCode}
          required
          disabled={pending}
        />
        <TextField
          label="Title name"
          value={form.titleName}
          onChange={(value) => setForm((current) => ({ ...current, titleName: value }))}
          error={fieldErrors.titleName}
          required
          disabled={pending}
        />
        <SelectField
          label="Gender"
          value={form.genderId || undefined}
          onValueChange={(value) => setForm((current) => ({ ...current, genderId: value ?? '' }))}
          options={genderOptions}
          error={fieldErrors.genderId}
          disabled={pending}
        />
        <NumericField
          label="Display order"
          value={form.displayOrder}
          onChange={(value) => setForm((current) => ({ ...current, displayOrder: value }))}
          error={fieldErrors.displayOrder}
          disabled={pending}
        />
        <SelectField
          label="Status"
          value={form.status}
          onValueChange={(value) =>
            setForm((current) => ({ ...current, status: value ?? 'ACTIVE' }))
          }
          options={toOptions(
            template.statusOptions.length > 0 ? template.statusOptions : ['ACTIVE', 'INACTIVE']
          )}
          error={fieldErrors.status}
          required
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

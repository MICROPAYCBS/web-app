'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationPaymentType } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createPaymentTypeAction, updatePaymentTypeAction } from '@/actions/payment-type';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { TextField } from '@/components/composites/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

type PaymentTypeFormState = {
  name: string;
  description: string;
  isCashPayment: boolean;
  position: string;
};

export type PaymentTypeFormInitial = {
  name?: string;
  description?: string;
  isCashPayment?: boolean;
  position?: number;
};

function defaultFormState(): PaymentTypeFormState {
  return {
    name: '',
    description: '',
    isCashPayment: false,
    position: '1'
  };
}

function formStateFromInitial(initial?: PaymentTypeFormInitial): PaymentTypeFormState {
  if (!initial) {
    return defaultFormState();
  }
  return {
    name: initial.name ?? '',
    description: initial.description ?? '',
    isCashPayment: initial.isCashPayment ?? false,
    position: initial.position != null ? String(initial.position) : '1'
  };
}

function formStateFromPaymentType(paymentType: OrganizationPaymentType): PaymentTypeFormState {
  return {
    name: paymentType.name,
    description: paymentType.description ?? '',
    isCashPayment: Boolean(paymentType.isCashPayment),
    position: paymentType.position != null ? String(paymentType.position) : '1'
  };
}

export function PaymentTypeFormSheet({
  open,
  onOpenChange,
  mode,
  paymentType,
  initial
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  paymentType?: OrganizationPaymentType;
  initial?: PaymentTypeFormInitial;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<PaymentTypeFormState>(() =>
    paymentType ? formStateFromPaymentType(paymentType) : formStateFromInitial(initial)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSystemDefined = Boolean(paymentType?.isSystemDefined);

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setForm(
        paymentType ? formStateFromPaymentType(paymentType) : formStateFromInitial(initial)
      );
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  function patchForm(patch: Partial<PaymentTypeFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createPaymentTypeAction({
              name: form.name,
              description: form.description.trim() || undefined,
              isCashPayment: form.isCashPayment,
              position: Number(form.position)
            })
          : await updatePaymentTypeAction(
              paymentType!.id,
              isSystemDefined
                ? {
                    name: form.name,
                    description: form.description.trim() || undefined
                  }
                : {
                    name: form.name,
                    description: form.description.trim() || undefined,
                    isCashPayment: form.isCashPayment,
                    position: Number(form.position)
                  },
              isSystemDefined
            );

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(mode === 'create' ? 'Payment type created.' : 'Payment type updated.');
      handleOpenChange(false);
      router.refresh();
    });
  }

  const canSubmit = form.name.trim().length > 0 && form.position.trim().length > 0;

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create payment type' : 'Edit payment type'}
      description={
        mode === 'create'
          ? 'Define how payments are classified in transactions and collections.'
          : isSystemDefined
            ? 'System-defined payment types only allow name and description changes.'
            : 'Update payment type details.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create payment type' : 'Save changes'}
      submitDisabled={!canSubmit}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
      error={
        submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null
      }
    >
      <form id={formId} className="grid gap-4" onSubmit={handleSubmit}>
        <TextField
          id={`${formId}-name`}
          label="Payment type"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          error={fieldErrors.name}
          disabled={pending}
        />
        <div className="space-y-2">
          <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
          <Textarea
            id={`${formId}-description`}
            rows={3}
            value={form.description}
            onChange={(event) => patchForm({ description: event.target.value })}
            disabled={pending}
          />
        </div>
        <Field orientation="horizontal" className="items-center gap-3">
          <Checkbox
            id={`${formId}-cash`}
            checked={form.isCashPayment}
            onCheckedChange={(checked) => patchForm({ isCashPayment: checked === true })}
            disabled={pending || (mode === 'edit' && isSystemDefined)}
          />
          <FieldContent>
            <FieldLabel htmlFor={`${formId}-cash`}>Is cash payment?</FieldLabel>
          </FieldContent>
        </Field>
        <NumericField
          id={`${formId}-position`}
          label="Position"
          required
          value={form.position}
          onChange={(value) => patchForm({ position: value })}
          error={fieldErrors.position}
          disabled={pending || (mode === 'edit' && isSystemDefined)}
        />
      </form>
    </FormSheet>
  );
}

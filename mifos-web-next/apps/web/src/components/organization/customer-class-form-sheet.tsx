'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CustomerClass, CustomerClassTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createCustomerClassAction,
  updateCustomerClassAction
} from '@/actions/customer-class';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';

type CustomerClassFormState = {
  classCode: string;
  className: string;
  description: string;
  customerType: string;
  riskLevel: string;
  kycLevel: string;
  loanEligible: boolean;
  restrictionId: string;
  overdraftAllowed: boolean;
  enhancedDueDiligence: boolean;
  reclassificationAllowed: boolean;
  minAge: string;
  maxAge: string;
  enforceCustPhoto: boolean;
  enforceCustSignature: boolean;
  enforceCustDocument: boolean;
  autoCreateAccount: boolean;
  status: string;
};

function defaultFormState(): CustomerClassFormState {
  return {
    classCode: '',
    className: '',
    description: '',
    customerType: '',
    riskLevel: '',
    kycLevel: '',
    loanEligible: true,
    restrictionId: '',
    overdraftAllowed: false,
    enhancedDueDiligence: false,
    reclassificationAllowed: true,
    minAge: '',
    maxAge: '',
    enforceCustPhoto: true,
    enforceCustSignature: true,
    enforceCustDocument: true,
    autoCreateAccount: false,
    status: 'ACTIVE'
  };
}

function formStateFromCustomerClass(customerClass: CustomerClass): CustomerClassFormState {
  return {
    classCode: customerClass.classCode,
    className: customerClass.className,
    description: customerClass.description ?? '',
    customerType: customerClass.customerType ?? '',
    riskLevel: customerClass.riskLevel ?? '',
    kycLevel: customerClass.kycLevel ?? '',
    loanEligible: customerClass.loanEligible ?? true,
    restrictionId: customerClass.restrictionId != null ? String(customerClass.restrictionId) : '',
    overdraftAllowed: customerClass.overdraftAllowed ?? false,
    enhancedDueDiligence: customerClass.enhancedDueDiligence ?? false,
    reclassificationAllowed: customerClass.reclassificationAllowed ?? true,
    minAge: customerClass.minAge != null ? String(customerClass.minAge) : '',
    maxAge: customerClass.maxAge != null ? String(customerClass.maxAge) : '',
    enforceCustPhoto: customerClass.enforceCustPhoto ?? true,
    enforceCustSignature: customerClass.enforceCustSignature ?? true,
    enforceCustDocument: customerClass.enforceCustDocument ?? true,
    autoCreateAccount: customerClass.autoCreateAccount ?? false,
    status: customerClass.status ?? 'ACTIVE'
  };
}

function toOptions(values: string[]) {
  return values.map((value) => ({ value, label: value.replaceAll('_', ' ') }));
}

function restrictionOptions(template: CustomerClassTemplate) {
  return template.restrictionOptions.map((option) => ({
    value: String(option.id),
    label: `${option.restrictionCode} — ${option.restrictionName}`
  }));
}

export function CustomerClassFormSheet({
  open,
  onOpenChange,
  mode,
  customerClass,
  template
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  customerClass?: CustomerClass;
  template: CustomerClassTemplate;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<CustomerClassFormState>(() =>
    customerClass ? formStateFromCustomerClass(customerClass) : defaultFormState()
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setForm(customerClass ? formStateFromCustomerClass(customerClass) : defaultFormState());
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  function patchForm(patch: Partial<CustomerClassFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const payload = {
      classCode: form.classCode,
      className: form.className,
      description: form.description.trim() || undefined,
      customerType: form.customerType || undefined,
      riskLevel: form.riskLevel || undefined,
      kycLevel: form.kycLevel || undefined,
      loanEligible: form.loanEligible,
      restrictionId: form.restrictionId ? Number(form.restrictionId) : undefined,
      overdraftAllowed: form.overdraftAllowed,
      enhancedDueDiligence: form.enhancedDueDiligence,
      reclassificationAllowed: form.reclassificationAllowed,
      minAge: form.minAge.trim() ? Number(form.minAge) : undefined,
      maxAge: form.maxAge.trim() ? Number(form.maxAge) : undefined,
      enforceCustPhoto: form.enforceCustPhoto,
      enforceCustSignature: form.enforceCustSignature,
      enforceCustDocument: form.enforceCustDocument,
      autoCreateAccount: form.autoCreateAccount,
      status: form.status as 'ACTIVE' | 'INACTIVE'
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createCustomerClassAction(payload)
          : await updateCustomerClassAction(customerClass!.id, payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(mode === 'create' ? 'Customer class created.' : 'Customer class updated.');
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create customer class' : 'Edit customer class'}
      description="Define eligibility, KYC requirements, and product rules for a customer segment."
      formId={formId}
      submitLoading={pending}
      submitLabel={mode === 'create' ? 'Create' : 'Save changes'}
      className="data-[side=right]:sm:max-w-2xl"
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        {submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Class code"
            value={form.classCode}
            onChange={(value) => patchForm({ classCode: value })}
            error={fieldErrors.classCode}
            required
            disabled={pending}
          />
          <TextField
            label="Class name"
            value={form.className}
            onChange={(value) => patchForm({ className: value })}
            error={fieldErrors.className}
            required
            disabled={pending}
          />
        </div>

        <Field>
          <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
          <FieldContent>
            <Textarea
              id={`${formId}-description`}
              value={form.description}
              onChange={(event) => patchForm({ description: event.target.value })}
              disabled={pending}
              rows={3}
            />
          </FieldContent>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Customer type"
            value={form.customerType || undefined}
            onValueChange={(value) => patchForm({ customerType: value ?? '' })}
            options={toOptions(template.customerTypeOptions)}
            placeholder="Select customer type"
            error={fieldErrors.customerType}
            disabled={pending}
          />
          <SelectField
            label="Status"
            value={form.status}
            onValueChange={(value) => patchForm({ status: value ?? 'ACTIVE' })}
            options={toOptions(template.statusOptions)}
            error={fieldErrors.status}
            disabled={pending}
          />
          <SelectField
            label="Risk level"
            value={form.riskLevel || undefined}
            onValueChange={(value) => patchForm({ riskLevel: value ?? '' })}
            options={toOptions(template.riskLevelOptions)}
            placeholder="Select risk level"
            error={fieldErrors.riskLevel}
            disabled={pending}
          />
          <SelectField
            label="KYC level"
            value={form.kycLevel || undefined}
            onValueChange={(value) => patchForm({ kycLevel: value ?? '' })}
            options={toOptions(template.kycLevelOptions)}
            placeholder="Select KYC level"
            error={fieldErrors.kycLevel}
            disabled={pending}
          />
          <SelectField
            label="Restriction"
            value={form.restrictionId || undefined}
            onValueChange={(value) => patchForm({ restrictionId: value ?? '' })}
            options={restrictionOptions(template)}
            placeholder="No restriction"
            error={fieldErrors.restrictionId}
            disabled={pending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            label="Minimum age"
            value={form.minAge}
            onChange={(value) => patchForm({ minAge: value })}
            error={fieldErrors.minAge}
            disabled={pending}
          />
          <NumericField
            label="Maximum age"
            value={form.maxAge}
            onChange={(value) => patchForm({ maxAge: value })}
            error={fieldErrors.maxAge}
            disabled={pending}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['loanEligible', 'Loan eligible'],
              ['overdraftAllowed', 'Overdraft allowed'],
              ['enhancedDueDiligence', 'Enhanced due diligence'],
              ['reclassificationAllowed', 'Reclassification allowed'],
              ['enforceCustPhoto', 'Require customer photo'],
              ['enforceCustSignature', 'Require customer signature'],
              ['enforceCustDocument', 'Require customer document'],
              ['autoCreateAccount', 'Auto-create account']
            ] as const
          ).map(([key, label]) => (
            <Field key={key} orientation="horizontal">
              <Checkbox
                id={`${formId}-${key}`}
                checked={form[key]}
                onCheckedChange={(checked) => patchForm({ [key]: checked === true })}
                disabled={pending}
              />
              <FieldLabel htmlFor={`${formId}-${key}`}>{label}</FieldLabel>
            </Field>
          ))}
        </div>
      </form>
    </FormSheet>
  );
}

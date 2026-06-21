'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractIncomeSourceOptions } from '@mifos/api-client';
import type { IncomeSourceInput } from '@mifos/validation';
import { useId, useState } from 'react';
import { SectorCascadeSelect } from '@/components/clients/shared/sector-cascade-select';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import type { FormSubmitResult } from '@/lib/form/submit-result';
import { toSelectOptions } from '@/lib/form/select-options';

function defaultForm(m?: IncomeSourceInput): IncomeSourceInput {
  return {
    incomeSourceTypeId: m?.incomeSourceTypeId ?? 0,
    sourceOfFundsId: m?.sourceOfFundsId,
    employerBusinessName: m?.employerBusinessName ?? '',
    employerAddress: m?.employerAddress ?? '',
    occupation: m?.occupation ?? '',
    subIndustryId: m?.subIndustryId,
    monthlyIncome: m?.monthlyIncome,
    incomeCurrencyCode: m?.incomeCurrencyCode ?? '',
    incomeFrequencyId: m?.incomeFrequencyId,
    startDate: m?.startDate,
    endDate: m?.endDate,
    isPrimarySource: m?.isPrimarySource ?? false,
    verificationStatusId: m?.verificationStatusId,
    supportingDocument: m?.supportingDocument ?? '',
    remarks: m?.remarks ?? '',
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

export function IncomeSourceFormSheet({
  open,
  onOpenChange,
  options,
  incomeSource,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: FineractIncomeSourceOptions | undefined;
  incomeSource?: IncomeSourceInput;
  onSave: (entry: IncomeSourceInput) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const [form, setForm] = useState<IncomeSourceInput>(() => defaultForm(incomeSource));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    if (next) {
      setForm(defaultForm(incomeSource));
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSave() {
    if (isSubmitting) {
      return;
    }
    if (!form.incomeSourceTypeId) {
      setError('Income source type is required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onSave(form);
      if (result.ok) {
        handleOpenChange(false);
        return;
      }
      setError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={incomeSource ? 'Edit income source' : 'Add income source'}
      description="Capture how this customer earns income and where funds originate (AML/KYC)."
      formId={formId}
      submitLabel="Save"
      onSubmit={handleSave}
      submitLoading={isSubmitting || submitLoading}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form
        id={formId}
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
        <SelectField
          id="incomeSourceTypeId"
          label="Income source type"
          required
          value={form.incomeSourceTypeId ? String(form.incomeSourceTypeId) : undefined}
          onValueChange={(v) => setForm({ ...form, incomeSourceTypeId: Number(v) })}
          options={toSelectOptions(options?.incomeSourceTypeOptions)}
          className="sm:col-span-2"
        />
        <SelectField
          id="sourceOfFundsId"
          label="Source of funds"
          optional
          value={form.sourceOfFundsId ? String(form.sourceOfFundsId) : undefined}
          onValueChange={(v) => setForm({ ...form, sourceOfFundsId: v ? Number(v) : undefined })}
          options={toSelectOptions(options?.sourceOfFundsOptions)}
          className="sm:col-span-2"
        />
        <TextField
          id="employerBusinessName"
          label="Employer / business name"
          optional
          value={form.employerBusinessName ?? ''}
          onChange={(v) => setForm({ ...form, employerBusinessName: v })}
          className="sm:col-span-2"
        />
        <TextField
          id="employerAddress"
          label="Employer / business address"
          optional
          value={form.employerAddress ?? ''}
          onChange={(v) => setForm({ ...form, employerAddress: v })}
          className="sm:col-span-2"
          hint="Postal or physical address for the employer or business entity."
        />
        <TextField
          id="occupation"
          label="Occupation"
          optional
          value={form.occupation ?? ''}
          onChange={(v) => setForm({ ...form, occupation: v })}
        />
        <TextField
          id="monthlyIncome"
          label="Monthly income"
          optional
          type="number"
          value={form.monthlyIncome != null ? String(form.monthlyIncome) : ''}
          onChange={(v) => setForm({ ...form, monthlyIncome: v ? Number(v) : undefined })}
        />
        <SelectField
          id="incomeFrequencyId"
          label="Income frequency"
          optional
          value={form.incomeFrequencyId ? String(form.incomeFrequencyId) : undefined}
          onValueChange={(v) => setForm({ ...form, incomeFrequencyId: v ? Number(v) : undefined })}
          options={toSelectOptions(options?.incomeFrequencyOptions)}
        />
        <TextField
          id="incomeCurrencyCode"
          label="Currency code"
          optional
          value={form.incomeCurrencyCode ?? ''}
          onChange={(v) => setForm({ ...form, incomeCurrencyCode: v })}
          hint="ISO 4217 code, e.g. UGX"
        />
        <SectorCascadeSelect
          subIndustryId={form.subIndustryId}
          onSubIndustryIdChange={(subIndustryId) => setForm({ ...form, subIndustryId })}
          optional
        />
        <DateField
          id="startDate"
          label="Start date"
          optional
          value={form.startDate}
          onChange={(v) => setForm({ ...form, startDate: v })}
        />
        <DateField
          id="endDate"
          label="End date"
          optional
          value={form.endDate}
          onChange={(v) => setForm({ ...form, endDate: v })}
        />
        <SwitchField
          id="isPrimarySource"
          className="sm:col-span-2"
          label="Primary income source"
          optional
          checked={form.isPrimarySource ?? false}
          description="Only one primary income source is allowed per customer."
          onCheckedChange={(checked) => setForm({ ...form, isPrimarySource: checked })}
        />
        <TextField
          id="remarks"
          label="Remarks"
          optional
          value={form.remarks ?? ''}
          onChange={(v) => setForm({ ...form, remarks: v })}
          className="sm:col-span-2"
        />
      </form>
    </FormSheet>
  );
}

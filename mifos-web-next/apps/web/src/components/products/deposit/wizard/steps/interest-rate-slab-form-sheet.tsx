'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  depositProductChartSlabSchema,
  type DepositProductChartSlabInput
} from '@mifos/validation';
import { useEffect, useId, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import type { SelectOption } from '@/components/composites/select-field';

function emptySlab(defaultPeriodType?: number): DepositProductChartSlabInput {
  return {
    periodType: defaultPeriodType,
    fromPeriod: undefined,
    toPeriod: undefined,
    amountRangeFrom: undefined,
    amountRangeTo: undefined,
    annualInterestRate: undefined,
    description: 'Default',
    incentives: []
  };
}

export function InterestRateSlabFormSheet({
  open,
  onOpenChange,
  slab,
  periodOptions,
  defaultPeriodType,
  primaryGroupingByAmount,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slab?: DepositProductChartSlabInput;
  periodOptions: SelectOption[];
  defaultPeriodType?: number;
  primaryGroupingByAmount: boolean;
  onSave: (slab: DepositProductChartSlabInput) => void;
}) {
  const formId = useId();
  const [form, setForm] = useState<DepositProductChartSlabInput>(emptySlab(defaultPeriodType));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(slab);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(slab ? { ...slab, incentives: slab.incentives ?? [] } : emptySlab(defaultPeriodType));
    setFieldErrors({});
    setError(null);
  }, [open, slab, defaultPeriodType]);

  function handleSubmit() {
    const parsed = depositProductChartSlabSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !next[key]) {
          next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      setError('Please fix the highlighted fields.');
      return;
    }
    if (primaryGroupingByAmount && parsed.data.amountRangeFrom == null) {
      setFieldErrors((current) => ({
        ...current,
        amountRangeFrom: 'Amount from is required when primary grouping is by amount.'
      }));
      setError('Please fix the highlighted fields.');
      return;
    }
    setFieldErrors({});
    setError(null);
    onSave(parsed.data);
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit rate slab' : 'Add rate slab'}
      description={
        primaryGroupingByAmount
          ? 'Define the amount range (and optional term). First slab amount from must be 0; the last slab amount to must be blank (open-ended). No overlaps.'
          : 'Define the term range (and optional amount). First slab period from must be 0; the last slab period to must be blank (open-ended). No overlaps.'
      }
      formId={formId}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save slab' : 'Add slab'}
      error={error}
      className="data-[side=right]:sm:max-w-md"
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <SelectField
          id={`${formId}-periodType`}
          label="Period type"
          required
          value={form.periodType != null ? String(form.periodType) : undefined}
          onValueChange={(value) =>
            setForm((current) => ({
              ...current,
              periodType: value ? Number(value) : undefined
            }))
          }
          options={periodOptions}
          error={fieldErrors.periodType}
        />
        <NumericField
          id={`${formId}-fromPeriod`}
          label="Period from"
          required={!primaryGroupingByAmount}
          optional={primaryGroupingByAmount}
          integer
          value={form.fromPeriod != null ? String(form.fromPeriod) : ''}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              fromPeriod: value === '' ? undefined : Number(value)
            }))
          }
          error={fieldErrors.fromPeriod}
        />
        <NumericField
          id={`${formId}-toPeriod`}
          label="Period to"
          optional
          integer
          value={form.toPeriod != null ? String(form.toPeriod) : ''}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              toPeriod: value === '' ? undefined : Number(value)
            }))
          }
          error={fieldErrors.toPeriod}
        />
        <NumericField
          id={`${formId}-amountFrom`}
          label="Amount from"
          required={primaryGroupingByAmount}
          optional={!primaryGroupingByAmount}
          value={form.amountRangeFrom != null ? String(form.amountRangeFrom) : ''}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              amountRangeFrom: value === '' ? undefined : Number(value)
            }))
          }
          error={fieldErrors.amountRangeFrom}
        />
        <NumericField
          id={`${formId}-amountTo`}
          label="Amount to"
          optional
          value={form.amountRangeTo != null ? String(form.amountRangeTo) : ''}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              amountRangeTo: value === '' ? undefined : Number(value)
            }))
          }
          error={fieldErrors.amountRangeTo}
        />
        <NumericField
          id={`${formId}-rate`}
          label="Annual interest rate"
          required
          value={form.annualInterestRate != null ? String(form.annualInterestRate) : ''}
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              annualInterestRate: value === '' ? undefined : Number(value)
            }))
          }
          error={fieldErrors.annualInterestRate}
        />
        <TextField
          id={`${formId}-description`}
          label="Description"
          required
          value={form.description ?? ''}
          onChange={(description) => setForm((current) => ({ ...current, description }))}
          error={fieldErrors.description}
        />
      </form>
    </FormSheet>
  );
}

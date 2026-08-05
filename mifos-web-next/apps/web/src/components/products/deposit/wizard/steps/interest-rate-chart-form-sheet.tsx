'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  depositProductChartDetailsSchema,
  type DepositProductChartDetailsInput,
  type DepositProductChartInput
} from '@mifos/validation';
import { useEffect, useId, useState } from 'react';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';

/** Copy for the primary-grouping switch — period-first vs amount-first rate matching. */
export const PRIMARY_GROUPING_BY_AMOUNT_DESCRIPTION =
  'Off: match interest mainly by deposit term (period). On: match mainly by deposit amount. You can still set both ranges on each slab; this chooses which one takes priority for ordering and overlap checks.';

function emptyChartDetails(): DepositProductChartDetailsInput {
  return {
    name: '',
    description: '',
    fromDate: '',
    endDate: '',
    isPrimaryGroupingByAmount: false
  };
}

function chartDetailsFromChart(chart?: DepositProductChartInput): DepositProductChartDetailsInput {
  if (!chart) {
    return emptyChartDetails();
  }
  return {
    id: chart.id,
    name: chart.name ?? '',
    description: chart.description ?? '',
    fromDate: chart.fromDate ?? '',
    endDate: chart.endDate ?? '',
    isPrimaryGroupingByAmount: chart.isPrimaryGroupingByAmount ?? false
  };
}

export function InterestRateChartFormSheet({
  open,
  onOpenChange,
  chart,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chart?: DepositProductChartInput;
  onSave: (details: DepositProductChartDetailsInput) => void;
}) {
  const formId = useId();
  const [form, setForm] = useState<DepositProductChartDetailsInput>(emptyChartDetails);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(chart);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(chartDetailsFromChart(chart));
    setFieldErrors({});
    setError(null);
  }, [open, chart]);

  function handleSubmit() {
    const parsed = depositProductChartDetailsSchema.safeParse(form);
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
    setFieldErrors({});
    setError(null);
    onSave(parsed.data);
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit interest rate chart' : 'Add interest rate chart'}
      description="Set when this rate chart applies and how slabs are matched."
      formId={formId}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save chart' : 'Add chart'}
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
        <TextField
          id={`${formId}-name`}
          label="Name"
          optional
          value={form.name ?? ''}
          onChange={(name) => setForm((current) => ({ ...current, name }))}
          error={fieldErrors.name}
        />
        <DateField
          id={`${formId}-fromDate`}
          label="Valid from"
          required
          allowFuture
          dateFormat={FINERACT_DATE_FORMAT}
          value={form.fromDate || undefined}
          onChange={(fromDate) =>
            setForm((current) => ({ ...current, fromDate: fromDate ?? '' }))
          }
          error={fieldErrors.fromDate}
        />
        <DateField
          id={`${formId}-endDate`}
          label="End date"
          optional
          allowFuture
          dateFormat={FINERACT_DATE_FORMAT}
          value={form.endDate || undefined}
          onChange={(endDate) => setForm((current) => ({ ...current, endDate: endDate ?? '' }))}
          error={fieldErrors.endDate}
        />
        <SwitchField
          id={`${formId}-primaryGrouping`}
          label="Primary grouping by amount"
          description={PRIMARY_GROUPING_BY_AMOUNT_DESCRIPTION}
          checked={form.isPrimaryGroupingByAmount ?? false}
          onCheckedChange={(isPrimaryGroupingByAmount) =>
            setForm((current) => ({ ...current, isPrimaryGroupingByAmount }))
          }
          error={fieldErrors.isPrimaryGroupingByAmount}
        />
        <TextField
          id={`${formId}-description`}
          label="Description"
          optional
          multiline
          rows={3}
          value={form.description ?? ''}
          onChange={(description) => setForm((current) => ({ ...current, description }))}
          error={fieldErrors.description}
        />
      </form>
    </FormSheet>
  );
}

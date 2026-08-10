'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { chargeTierSchema, type ChargeTierInput } from '@mifos/validation';
import { useEffect, useId, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';

export type ChargeTierDraft = {
  amountRangeFrom?: number;
  amountRangeTo?: number | null;
  amount?: number;
};

function emptyTier(amountRangeFrom = 0): ChargeTierDraft {
  return {
    amountRangeFrom,
    amountRangeTo: null,
    amount: undefined
  };
}

function formatNumeric(value: number | null | undefined): string {
  return value != null ? String(value) : '';
}

function normalizeNumericInput(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
}

function parseOptionalNumber(value: string): number | undefined {
  const normalized = normalizeNumericInput(value);
  if (normalized === '' || normalized === '.') {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function ChargeTierFormSheet({
  open,
  onOpenChange,
  tier,
  defaultFrom,
  flatAmount,
  currencyCode,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: ChargeTierDraft;
  defaultFrom?: number;
  flatAmount: boolean;
  currencyCode?: string;
  onSave: (tier: ChargeTierInput) => void;
}) {
  const formId = useId();
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(tier);

  useEffect(() => {
    if (!open) {
      return;
    }
    const next = tier ? { ...tier } : emptyTier(defaultFrom ?? 0);
    setFromInput(formatNumeric(next.amountRangeFrom));
    setToInput(formatNumeric(next.amountRangeTo));
    setAmountInput(formatNumeric(next.amount));
    setFieldErrors({});
    setError(null);
  }, [open, tier, defaultFrom]);

  function handleSubmit() {
    const normalizedTo = normalizeNumericInput(toInput);
    const parsed = chargeTierSchema.safeParse({
      amountRangeFrom: parseOptionalNumber(fromInput),
      amountRangeTo: normalizedTo === '' ? null : parseOptionalNumber(normalizedTo),
      amount: parseOptionalNumber(amountInput)
    });
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
    if (
      parsed.data.amountRangeTo != null &&
      parsed.data.amountRangeTo <= parsed.data.amountRangeFrom
    ) {
      setFieldErrors({
        amountRangeTo: 'Range to must be greater than range from.'
      });
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
      title={isEdit ? 'Edit charge tier' : 'Add charge tier'}
      description="Lookup band: the charge uses the single matching range (from inclusive, to exclusive). The first tier must start at 0 and the last tier must leave To blank (open-ended)."
      formId={formId}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save tier' : 'Add tier'}
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
        <MoneyField
          id={`${formId}-from`}
          label="From"
          required
          currencyCode={currencyCode}
          value={fromInput}
          onChange={setFromInput}
          error={fieldErrors.amountRangeFrom}
          hint="Inclusive lower bound of the base amount."
        />
        <MoneyField
          id={`${formId}-to`}
          label="To"
          optional
          currencyCode={currencyCode}
          value={toInput}
          onChange={setToInput}
          error={fieldErrors.amountRangeTo}
          hint="Exclusive upper bound. Blank = open-ended."
        />
        {flatAmount ? (
          <MoneyField
            id={`${formId}-amount`}
            label="Amount"
            required
            currencyCode={currencyCode}
            value={amountInput}
            onChange={setAmountInput}
            error={fieldErrors.amount}
          />
        ) : (
          <NumericField
            id={`${formId}-amount`}
            label="Rate (%)"
            required
            value={amountInput}
            onChange={setAmountInput}
            error={fieldErrors.amount}
            hint="Percentage rate for this band, e.g. 0.5 for 0.5%."
            placeholder="0.5"
            maxDecimalPlaces={6}
          />
        )}
      </form>
    </FormSheet>
  );
}

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

function emptyTier(amountRangeFrom?: number): ChargeTierDraft {
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
  lockFrom,
  lockTo,
  minFrom,
  maxTo,
  flatAmount,
  currencyCode,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: ChargeTierDraft;
  defaultFrom?: number;
  lockFrom?: boolean;
  lockTo?: boolean;
  /** Exclusive: this band’s From must be greater than the previous From. */
  minFrom?: number;
  /** Exclusive: this band’s To must be less than the next band’s To. */
  maxTo?: number;
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
    const next = tier ? { ...tier } : emptyTier(lockFrom ? (defaultFrom ?? 0) : undefined);
    setFromInput(formatNumeric(next.amountRangeFrom));
    setToInput(lockTo ? '' : formatNumeric(next.amountRangeTo));
    setAmountInput(formatNumeric(next.amount));
    setFieldErrors({});
    setError(null);
  }, [open, tier, defaultFrom, lockFrom, lockTo]);

  function handleSubmit() {
    const normalizedTo = normalizeNumericInput(toInput);
    const parsed = chargeTierSchema.safeParse({
      amountRangeFrom: parseOptionalNumber(fromInput),
      amountRangeTo: lockTo || normalizedTo === '' ? null : parseOptionalNumber(normalizedTo),
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

    const from = parsed.data.amountRangeFrom;
    const to = parsed.data.amountRangeTo;
    if (!lockTo && to == null) {
      setFieldErrors({
        amountRangeTo: 'To is required so the next band can start here.'
      });
      setError('Please fix the highlighted fields.');
      return;
    }
    if (minFrom != null && from <= minFrom) {
      setFieldErrors({
        amountRangeFrom: `From must be greater than ${minFrom}.`
      });
      setError('Please fix the highlighted fields.');
      return;
    }
    if (to != null && to <= from) {
      setFieldErrors({
        amountRangeTo: 'Range to must be greater than range from.'
      });
      setError('Please fix the highlighted fields.');
      return;
    }
    if (to != null && maxTo != null && to >= maxTo) {
      setFieldErrors({
        amountRangeTo: `To must be less than ${maxTo}.`
      });
      setError('Please fix the highlighted fields.');
      return;
    }

    setFieldErrors({});
    setError(null);
    onSave(parsed.data);
    onOpenChange(false);
  }

  const fromHint = lockFrom
    ? 'Locked so bands stay contiguous (no gaps or overlaps).'
    : 'Start of this band and exclusive end of the previous band.';
  const toHint = lockTo
    ? 'The last band is always open-ended.'
    : 'Exclusive upper bound. The next band starts here.';

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit charge tier' : 'Add charge tier'}
      description="Lookup band: the charge uses the single matching range (from inclusive, to exclusive). Bands chain automatically with no gaps or overlaps. The last band stays open-ended."
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
          hint={fromHint}
          disabled={lockFrom}
        />
        <MoneyField
          id={`${formId}-to`}
          label="To"
          optional={lockTo}
          required={!lockTo}
          currencyCode={currencyCode}
          value={toInput}
          onChange={setToInput}
          error={fieldErrors.amountRangeTo}
          hint={toHint}
          disabled={lockTo}
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

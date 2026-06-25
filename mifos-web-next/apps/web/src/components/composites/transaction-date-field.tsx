'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useBusinessDate } from '@/components/platform/business-date-provider';
import { DateField, type DateFieldProps } from '@/components/composites/date-field';
import { FormLabel } from '@/components/composites/form-label';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { isTransactionDateLocked } from '@/lib/fineract/business-date-context';
import { fineractDateToDate } from '@/lib/fineract/date-input';
import { cn } from '@/lib/utils';

const readOnlyTriggerClassName = cn(
  'flex h-8 w-full min-w-0 items-center justify-start gap-2 rounded-lg border border-input bg-muted/40 px-2.5 py-1 text-sm font-normal shadow-none',
  'cursor-default text-foreground'
);

export type TransactionDateFieldProps = Omit<DateFieldProps, 'onChange'> & {
  onChange: (value: string) => void;
};

/**
 * Transaction / posting date — uses the organisation business date when configured (read-only),
 * otherwise a normal editable date field capped at today.
 */
export function TransactionDateField({
  id,
  label,
  value,
  onChange,
  error,
  disabled = false,
  className,
  required,
  optional,
  dateFormat,
  hint,
  hintAriaLabel,
  contextHelpSectionId
}: TransactionDateFieldProps) {
  const businessDate = useBusinessDate();
  const locked = isTransactionDateLocked(businessDate);

  useEffect(() => {
    if (locked && businessDate.date && value !== businessDate.date) {
      onChange(businessDate.date);
    }
  }, [businessDate.date, locked, onChange, value]);

  const display = useMemo(() => {
    if (businessDate.displayLabel) {
      return businessDate.displayLabel;
    }
    const selected = fineractDateToDate(value, dateFormat);
    return selected ? format(selected, 'PPP') : null;
  }, [businessDate.displayLabel, value, dateFormat]);

  if (locked) {
    return (
      <Field className={className} data-invalid={!!error}>
        <FormLabel
          htmlFor={id}
          required={required}
          optional={optional ?? !required}
          hint={hint}
          hintAriaLabel={hintAriaLabel}
          contextHelpSectionId={contextHelpSectionId}
        >
          {label}
        </FormLabel>
        <FieldContent>
          <div
            id={id}
            aria-invalid={!!error}
            className={cn(readOnlyTriggerClassName, disabled && 'opacity-50')}
          >
            <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
            <span className="truncate">{display ?? '—'}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Uses the organisation business date.
          </p>
          <FieldError>{error}</FieldError>
        </FieldContent>
      </Field>
    );
  }

  return (
    <DateField
      id={id}
      label={label}
      required={required}
      optional={optional}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      error={error}
      disabled={disabled}
      className={className}
      dateFormat={dateFormat}
      hint={hint}
      hintAriaLabel={hintAriaLabel}
      contextHelpSectionId={contextHelpSectionId}
    />
  );
}

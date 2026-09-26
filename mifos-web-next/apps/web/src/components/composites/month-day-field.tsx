'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  CHARGE_MONTH_DAY_ANCHOR_YEAR,
  chargeMonthDayToDate,
  dateToChargeMonthDay
} from '@mifos/validation';
import { CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormLabel } from '@/components/composites/form-label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MonthDayFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  /** Fineract month-day string, for example `04 Mar`. */
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  hint?: string;
  hintAriaLabel?: string;
}

const dateTriggerClassName = cn(
  'flex h-8 w-full min-w-0 items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm font-normal shadow-none transition-colors outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
  'dark:bg-input/30 dark:hover:bg-input/30'
);

const yearStart = new Date(CHARGE_MONTH_DAY_ANCHOR_YEAR, 0, 1);
const yearEnd = new Date(CHARGE_MONTH_DAY_ANCHOR_YEAR, 11, 31);

/**
 * Year-less calendar for charge due dates. Days that do not exist in the
 * selected month are not offered. February includes the 29th.
 */
export function MonthDayField({
  id,
  label,
  required = false,
  optional,
  value,
  onChange,
  error,
  disabled = false,
  className,
  placeholder = 'Pick a day',
  hint = 'Month and day. February includes the 29th. Shorter months hide days they do not have.',
  hintAriaLabel
}: MonthDayFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => chargeMonthDayToDate(value), [value]);
  const display = selected ? dateToChargeMonthDay(selected) : null;

  return (
    <Field className={className} data-invalid={!!error}>
      <FormLabel
        htmlFor={id}
        required={required}
        optional={optional ?? !required}
        hint={hint}
        hintAriaLabel={hintAriaLabel}
      >
        {label}
      </FormLabel>
      <FieldContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                id={id}
                type="button"
                variant="outline"
                disabled={disabled}
                aria-invalid={!!error}
                className={cn(dateTriggerClassName, !display && 'text-muted-foreground')}
              />
            }
          >
            <CalendarIcon className="size-4 shrink-0 opacity-60" />
            <span className="truncate">{display ?? placeholder}</span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown-months"
              selected={selected}
              defaultMonth={selected ?? yearStart}
              startMonth={yearStart}
              endMonth={yearEnd}
              onSelect={(date) => {
                onChange(dateToChargeMonthDay(date));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}

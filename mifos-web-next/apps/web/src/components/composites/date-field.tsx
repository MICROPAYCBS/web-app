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
import { useMemo, useState } from 'react';
import { FormLabel } from '@/components/composites/form-label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  dateToFineract,
  fineractDateToDate,
  startOfDay,
  todayStart
} from '@/lib/fineract/date-input';
import { cn } from '@/lib/utils';

export interface DateFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  /** Fineract date string (e.g. `29 May 2026`). */
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  /** Earliest selectable day (inclusive). */
  fromDate?: Date;
  /** Latest selectable day (inclusive). */
  toDate?: Date;
  /**
   * When false (default), dates after today are disabled — typical for
   * transactions and backdated entries. Set true for expiry dates and similar.
   */
  allowFuture?: boolean;
  /** Fineract tenant date format (from template); defaults to `dd MMMM yyyy`. */
  dateFormat?: string;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function subtractYears(date: Date, years: number): Date {
  return addYears(date, -years);
}

/** Matches `Input` / `SelectField` control height in form grids. */
const dateTriggerClassName = cn(
  'flex h-8 w-full min-w-0 items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm font-normal shadow-none transition-colors outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
  'dark:bg-input/30 dark:hover:bg-input/30'
);

function resolveEffectiveToDate(
  allowFuture: boolean,
  toDate: Date | undefined,
  today: Date
): Date | undefined {
  if (allowFuture) {
    return toDate;
  }
  if (toDate && startOfDay(toDate).getTime() < today.getTime()) {
    return toDate;
  }
  return today;
}

export function DateField({
  id,
  label,
  required = false,
  optional,
  value,
  onChange,
  error,
  disabled = false,
  className,
  placeholder = 'Pick a date',
  fromDate,
  toDate,
  allowFuture = false,
  dateFormat
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fineractDateToDate(value, dateFormat), [value, dateFormat]);
  const today = useMemo(() => todayStart(), []);

  const effectiveToDate = useMemo(
    () => resolveEffectiveToDate(allowFuture, toDate, today),
    [allowFuture, toDate, today]
  );

  const calendarStartMonth = useMemo(
    () => startOfDay(fromDate ?? subtractYears(today, 100)),
    [fromDate, today]
  );

  const calendarEndMonth = useMemo(() => {
    if (allowFuture) {
      return startOfDay(toDate ?? addYears(today, 50));
    }
    return today;
  }, [allowFuture, toDate, today]);

  const display = selected ? format(selected, 'PPP') : null;

  return (
    <Field className={className} data-invalid={!!error}>
      <FormLabel htmlFor={id} required={required} optional={optional ?? !required}>
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
              selected={selected}
              onSelect={(date) => {
                onChange(dateToFineract(date, dateFormat));
                setOpen(false);
              }}
              disabled={(date) => {
                const day = startOfDay(date);
                if (fromDate && day.getTime() < startOfDay(fromDate).getTime()) {
                  return true;
                }
                if (effectiveToDate && day.getTime() > startOfDay(effectiveToDate).getTime()) {
                  return true;
                }
                return false;
              }}
              defaultMonth={selected ?? today}
              startMonth={calendarStartMonth}
              endMonth={calendarEndMonth}
            />
          </PopoverContent>
        </Popover>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}

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
import { dateToFineract, fineractDateToDate } from '@/lib/fineract/date-input';
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
  fromDate?: Date;
  toDate?: Date;
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
  toDate
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => fineractDateToDate(value), [value]);

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
                className={cn(
                  'h-8 w-full justify-start px-2.5 font-normal',
                  !display && 'text-muted-foreground'
                )}
              />
            }
          >
            <CalendarIcon className="mr-2 size-4 shrink-0 opacity-60" />
            <span className="truncate">{display ?? placeholder}</span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(date) => {
                onChange(dateToFineract(date));
                setOpen(false);
              }}
              disabled={(date) => {
                if (fromDate && date < fromDate) {
                  return true;
                }
                if (toDate && date > toDate) {
                  return true;
                }
                return false;
              }}
              defaultMonth={selected}
            />
          </PopoverContent>
        </Popover>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  daysInChargeMonth,
  formatChargeMonthDay,
  isAcceptedChargeMonthDay,
  parseChargeMonthDay
} from '@mifos/validation';
import { useEffect, useState } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { cn } from '@/lib/utils';

export interface MonthDayFieldProps {
  id?: string;
  /** Annual fee picks a month and a day. Monthly fee picks the day of the month. */
  variant: 'annual' | 'monthly';
  required?: boolean;
  optional?: boolean;
  /** Fineract month-day string, for example `04 Mar`. */
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
] as const;

function dayOptions(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    return { value: String(day), label: String(day) };
  });
}

/** Month used when a monthly fee's day does not fit the month already saved. January has 31 days. */
function monthlyStorageMonth(month: number | undefined, day: number): number {
  if (month != null && isAcceptedChargeMonthDay(month, day)) {
    return month;
  }
  return 1;
}

/**
 * Recurring charge due date. Annual fees choose a month and a day.
 * Monthly fees choose the day of the month; the saved month is kept when it can hold that day.
 */
export function MonthDayField({
  id,
  variant,
  required = false,
  optional,
  value,
  onChange,
  error,
  disabled = false,
  className
}: MonthDayFieldProps) {
  const parsed = parseChargeMonthDay(value);
  const [draftMonth, setDraftMonth] = useState<number | undefined>(parsed?.month);
  const [draftDay, setDraftDay] = useState<number | undefined>(parsed?.day);

  useEffect(() => {
    if (!value) {
      setDraftMonth(undefined);
      setDraftDay(undefined);
    }
  }, [value]);

  const month = parsed?.month ?? draftMonth;
  const day = parsed?.day ?? draftDay;
  const dayCount = variant === 'monthly' ? 31 : month != null ? daysInChargeMonth(month) : 0;

  function selectMonth(nextValue: string | undefined) {
    const nextMonth = nextValue ? Number(nextValue) : undefined;
    setDraftMonth(nextMonth);
    if (nextMonth == null) {
      setDraftDay(undefined);
      onChange(undefined);
      return;
    }
    if (day == null) {
      return;
    }
    const nextDay = Math.min(day, daysInChargeMonth(nextMonth));
    setDraftDay(nextDay);
    onChange(formatChargeMonthDay(nextMonth, nextDay));
  }

  function selectDay(nextValue: string | undefined) {
    const nextDay = nextValue ? Number(nextValue) : undefined;
    setDraftDay(nextDay);
    if (nextDay == null) {
      onChange(undefined);
      return;
    }
    if (variant === 'monthly') {
      onChange(formatChargeMonthDay(monthlyStorageMonth(month, nextDay), nextDay));
      return;
    }
    if (month == null) {
      return;
    }
    onChange(formatChargeMonthDay(month, nextDay));
  }

  if (variant === 'monthly') {
    return (
      <SelectField
        id={id ? `${id}-day` : undefined}
        label="Day of month"
        required={required}
        optional={optional}
        value={day != null ? String(day) : undefined}
        onValueChange={selectDay}
        options={dayOptions(31)}
        placeholder="Select day"
        error={error}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <SelectField
        id={id ? `${id}-month` : undefined}
        label="Month"
        required={required}
        optional={optional}
        value={month != null ? String(month) : undefined}
        onValueChange={selectMonth}
        options={[...MONTH_OPTIONS]}
        placeholder="Select month"
        disabled={disabled}
      />
      <SelectField
        id={id ? `${id}-day` : undefined}
        label="Day"
        required={required}
        optional={optional}
        value={day != null ? String(day) : undefined}
        onValueChange={selectDay}
        options={dayOptions(dayCount)}
        placeholder={month == null ? 'Select month first' : 'Select day'}
        error={error}
        disabled={disabled || month == null}
      />
    </div>
  );
}

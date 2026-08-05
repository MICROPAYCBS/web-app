'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { useBusinessDate } from '@/components/platform/business-date-provider';
import { DateField, type DateFieldProps } from '@/components/composites/date-field';
import {
  businessDateBackdatedEntryHint,
  businessDateTransactionHint,
  hasConfiguredBusinessDate,
  isTransactionDateBackdated
} from '@/lib/fineract/business-date-context';
import { fineractDateToDate } from '@/lib/fineract/date-input';

export type TransactionDateFieldProps = Omit<DateFieldProps, 'onChange'> & {
  onChange: (value: string) => void;
};

function earlierDate(a: Date | undefined, b: Date | undefined): Date | undefined {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return a.getTime() <= b.getTime() ? a : b;
}

/**
 * Transaction / posting date — defaults to the organisation business date when
 * configured, editable for backdated entries, capped at the business date (or today).
 * Optional `fromDate` / `toDate` further constrain the picker (e.g. product window).
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
  fromDate,
  toDate,
  hint,
  hintAriaLabel,
  contextHelpSectionId
}: TransactionDateFieldProps) {
  const businessDate = useBusinessDate();
  const hasBusinessDate = hasConfiguredBusinessDate(businessDate);
  const isNotToday = businessDate.isNotToday === true;

  const businessMax = useMemo(
    () => fineractDateToDate(businessDate.date, dateFormat),
    [businessDate.date, dateFormat]
  );

  const effectiveToDate = useMemo(
    () => earlierDate(hasBusinessDate ? businessMax : undefined, toDate),
    [businessMax, hasBusinessDate, toDate]
  );

  const isBackdated = useMemo(
    () => isTransactionDateBackdated(value, businessDate.date, dateFormat),
    [value, businessDate.date, dateFormat]
  );

  const resolvedHint = useMemo(() => {
    if (hint) {
      return hint;
    }
    if (!hasBusinessDate) {
      return undefined;
    }
    const parts = [businessDateTransactionHint(isNotToday)];
    if (isBackdated) {
      parts.push(businessDateBackdatedEntryHint());
    }
    return parts.join(' ');
  }, [hasBusinessDate, hint, isBackdated, isNotToday]);

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
      fromDate={fromDate}
      toDate={effectiveToDate}
      hint={resolvedHint}
      hintAriaLabel={hintAriaLabel}
      contextHelpSectionId={contextHelpSectionId}
    />
  );
}

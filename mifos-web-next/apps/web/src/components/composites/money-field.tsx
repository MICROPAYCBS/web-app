'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatAmount, parseAmount, toDecimal } from '@mifos/domain';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { FormLabel } from '@/components/composites/form-label';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Strip grouping separators; keep digits and at most one decimal point. */
export function sanitizeMoneyInput(raw: string): string {
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) {
    return cleaned;
  }
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');
}

function formatIntegerWithGrouping(intPart: string, locale = 'en'): string {
  if (!intPart) {
    return '';
  }
  const normalized = intPart.replace(/^0+(?=\d)/, '') || '0';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(normalized));
}

/** Format a sanitized amount for in-progress editing (grouping, preserve typed decimals). */
export function formatMoneyInputDisplay(sanitized: string, locale = 'en'): string {
  if (!sanitized) {
    return '';
  }

  const dotIndex = sanitized.indexOf('.');
  const intPart = dotIndex === -1 ? sanitized : sanitized.slice(0, dotIndex);
  const decPart = dotIndex === -1 ? undefined : sanitized.slice(dotIndex + 1);
  const formattedInt = formatIntegerWithGrouping(intPart, locale);

  if (dotIndex === -1) {
    return formattedInt;
  }

  return `${formattedInt}.${decPart ?? ''}`;
}

function formatForDisplay(value: string, locale = 'en'): string {
  const decimal = parseAmount(value) ?? toDecimal(value);
  if (!decimal) {
    return formatMoneyInputDisplay(value, locale);
  }
  return formatAmount(decimal, locale);
}

function canonicalize(value: string): string {
  const decimal = parseAmount(value) ?? toDecimal(value);
  if (!decimal) {
    return sanitizeMoneyInput(value);
  }
  return decimal.toString();
}

/** Count digits strictly before the cursor (ignores grouping separators). */
export function digitIndexBeforeCursor(value: string, cursor: number): number {
  let digits = 0;
  for (let i = 0; i < cursor && i < value.length; i++) {
    if (/\d/.test(value[i])) {
      digits++;
    }
  }
  return digits;
}

/** Map a digit index in the sanitized value to a cursor position in the formatted string. */
export function cursorAfterDigitIndex(formatted: string, digitIndex: number): number {
  if (digitIndex <= 0) {
    return 0;
  }

  let digits = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digits++;
      if (digits === digitIndex) {
        return i + 1;
      }
    }
  }

  return formatted.length;
}

export interface MoneyFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  value?: string;
  onChange: (value: string) => void;
  currencyCode?: string;
  locale?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  hint?: string;
  hintAriaLabel?: string;
  /** Always-visible helper text shown below the label (e.g. allowed value range). */
  description?: string;
  /** Visually hide the label (kept for screen readers). */
  hideLabel?: boolean;
  contextHelpSectionId?: string;
  onBlur?: () => void;
}

export function MoneyField({
  id: idProp,
  label,
  required = false,
  optional,
  value = '',
  onChange,
  currencyCode,
  locale = 'en',
  error,
  disabled = false,
  className,
  placeholder,
  hint,
  hintAriaLabel,
  description,
  hideLabel = false,
  contextHelpSectionId,
  onBlur
}: MoneyFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);

  const inputDisabled = disabled || !currencyCode;
  const displayValue = value
    ? focused
      ? formatMoneyInputDisplay(value, locale)
      : formatForDisplay(value, locale)
    : '';
  const resolvedPlaceholder =
    placeholder ?? (currencyCode ? '0.00' : 'Select currency first');

  useLayoutEffect(() => {
    if (pendingCursorRef.current == null || !inputRef.current || !focused) {
      return;
    }
    const cursor = pendingCursorRef.current;
    inputRef.current.setSelectionRange(cursor, cursor);
    pendingCursorRef.current = null;
  }, [displayValue, focused]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const cursor = input.selectionStart ?? 0;
    const digitIndex = digitIndexBeforeCursor(input.value, cursor);
    const sanitized = sanitizeMoneyInput(input.value);
    const formatted = formatMoneyInputDisplay(sanitized, locale);
    pendingCursorRef.current = cursorAfterDigitIndex(formatted, digitIndex);
    onChange(sanitized);
  }

  return (
    <Field className={className} data-invalid={!!error}>
      <FormLabel
        htmlFor={id}
        required={required}
        optional={hideLabel ? false : (optional ?? !required)}
        hint={hint}
        hintAriaLabel={hintAriaLabel}
        contextHelpSectionId={contextHelpSectionId}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
      </FormLabel>
      {description ? (
        <p className="-mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FieldContent>
        <div className="relative flex">
          {currencyCode ? (
            <span
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-sm text-muted-foreground',
                inputDisabled && 'opacity-50'
              )}
              aria-hidden
            >
              {currencyCode.trim().toUpperCase()}
            </span>
          ) : null}
          <Input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={displayValue}
            disabled={inputDisabled}
            placeholder={resolvedPlaceholder}
            aria-invalid={!!error}
            className={cn(currencyCode && 'pl-12 tabular-nums')}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (value) {
                onChange(canonicalize(value));
              }
              onBlur?.();
            }}
            onChange={handleChange}
          />
        </div>
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}

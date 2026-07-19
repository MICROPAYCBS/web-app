'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormLabel } from '@/components/composites/form-label';
import { Field, FieldContent, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface SanitizeNumericInputOptions {
  /** When true, only whole numbers are allowed. Default false (decimals allowed). */
  integer?: boolean;
  /** Allow a leading minus sign. Default false. */
  allowNegative?: boolean;
  /** Cap digits after the decimal point. No cap when omitted. */
  maxDecimalPlaces?: number;
}

/** Strip invalid characters; keep at most one decimal point and optional leading minus. */
export function sanitizeNumericInput(
  raw: string,
  options: SanitizeNumericInputOptions = {}
): string {
  const { integer = false, allowNegative = false, maxDecimalPlaces } = options;
  const trimmed = raw.replace(/,/g, '');
  const negative = allowNegative && trimmed.trimStart().startsWith('-');
  const unsigned = trimmed.replace(/-/g, '');

  if (integer) {
    const withoutDecimals = unsigned.includes('.')
      ? unsigned.slice(0, unsigned.indexOf('.'))
      : unsigned;
    const digits = withoutDecimals.replace(/\D/g, '');
    if (!digits && negative) {
      return '-';
    }
    return negative ? `-${digits}` : digits;
  }

  const cleaned = unsigned.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) {
    if (!cleaned && negative) {
      return '-';
    }
    return negative ? `-${cleaned}` : cleaned;
  }

  let decPart = cleaned.slice(dot + 1).replace(/\./g, '');
  if (maxDecimalPlaces != null) {
    decPart = decPart.slice(0, maxDecimalPlaces);
  }
  const body = `${cleaned.slice(0, dot + 1)}${decPart}`;
  return negative ? `-${body}` : body;
}

export interface NumericFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  value?: string;
  onChange: (value: string) => void;
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
  integer?: boolean;
  allowNegative?: boolean;
  maxDecimalPlaces?: number;
  onBlur?: () => void;
}

/**
 * Numeric input with keystroke filtering (type="number" alone allows e, +, etc.).
 * Monetary amounts should use {@link MoneyField} instead.
 */
export function NumericField({
  id,
  label,
  required = false,
  optional,
  value = '',
  onChange,
  error,
  disabled = false,
  className,
  placeholder,
  hint,
  hintAriaLabel,
  description,
  hideLabel = false,
  integer = false,
  allowNegative = false,
  maxDecimalPlaces,
  onBlur
}: NumericFieldProps) {
  const sanitizeOptions = { integer, allowNegative, maxDecimalPlaces };

  return (
    <Field className={className} data-invalid={!!error}>
      <FormLabel
        htmlFor={id}
        required={required}
        optional={hideLabel ? false : (optional ?? !required)}
        hint={hint}
        hintAriaLabel={hintAriaLabel}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
      </FormLabel>
      {description ? (
        <p className="-mt-1 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FieldContent>
        <Input
          id={id}
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          aria-invalid={!!error}
          disabled={disabled}
          className="tabular-nums"
          onChange={(event) => onChange(sanitizeNumericInput(event.target.value, sanitizeOptions))}
          onBlur={onBlur}
        />
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}

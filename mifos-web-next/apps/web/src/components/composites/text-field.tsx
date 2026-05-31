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
import { Textarea } from '@/components/ui/textarea';

export interface TextFieldProps {
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  placeholder?: string;
}

export function TextField({
  id,
  label,
  required = false,
  optional,
  value = '',
  onChange,
  error,
  type = 'text',
  autoComplete,
  multiline = false,
  rows = 2,
  className,
  placeholder
}: TextFieldProps) {
  return (
    <Field className={className} data-invalid={!!error}>
      <FormLabel htmlFor={id} required={required} optional={optional ?? !required}>
        {label}
      </FormLabel>
      <FieldContent>
        {multiline ? (
          <Textarea
            id={id}
            rows={rows}
            value={value}
            placeholder={placeholder}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <Input
            id={id}
            type={type}
            value={value}
            autoComplete={autoComplete}
            placeholder={placeholder}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        <FieldError>{error}</FieldError>
      </FieldContent>
    </Field>
  );
}

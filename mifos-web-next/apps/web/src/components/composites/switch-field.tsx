'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormLabel } from '@/components/composites/form-label';
import { Field, FieldError } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface SwitchFieldProps {
  id?: string;
  label: string;
  description?: string;
  required?: boolean;
  optional?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Full-width boolean control for wizards (Active, Open savings, flags).
 * One logical field per ADR-006 counting rules.
 */
export function SwitchField({
  id,
  label,
  description,
  required = false,
  optional,
  checked,
  onCheckedChange,
  error,
  disabled = false,
  className
}: SwitchFieldProps) {
  return (
    <Field className={cn('sm:col-span-2', className)} data-invalid={!!error}>
      <div
        className={cn(
          'flex w-full min-h-8 items-center justify-between gap-4 rounded-lg border border-input px-3 py-2 dark:bg-input/30',
          error && 'border-destructive ring-3 ring-destructive/20'
        )}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <FormLabel
            htmlFor={id}
            required={required}
            optional={optional ?? !required}
            className="cursor-pointer leading-snug"
          >
            {label}
          </FormLabel>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <Switch
          id={id}
          checked={checked}
          disabled={disabled}
          aria-invalid={!!error}
          onCheckedChange={onCheckedChange}
        />
      </div>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

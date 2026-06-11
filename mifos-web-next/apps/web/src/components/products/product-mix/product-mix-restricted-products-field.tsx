'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProductMixProductOption } from '@mifos/api-client';
import { FormLabel } from '@/components/composites/form-label';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError } from '@/components/ui/field';

export function ProductMixRestrictedProductsField({
  label,
  options,
  value,
  onChange,
  error,
  disabled = false
}: {
  label: string;
  options: ProductMixProductOption[];
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <Field>
      <FormLabel required>{label}</FormLabel>
      <FieldContent>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {options.length ? (
            options.map((option) => {
              const checked = value.includes(option.id);
              return (
                <label key={option.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) => {
                      if (next === true) {
                        onChange([...value, option.id]);
                        return;
                      }
                      onChange(value.filter((entry) => entry !== option.id));
                    }}
                  />
                  <span>{option.name ?? `Product #${option.id}`}</span>
                </label>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No products available.</p>
          )}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}

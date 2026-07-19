'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ProvisioningCriteriaLoanProduct } from '@mifos/api-client';
import { FormLabel } from '@/components/composites/form-label';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError } from '@/components/ui/field';

export function ProvisioningCriteriaLoanProductsField({
  options,
  value,
  onChange,
  error,
  disabled = false
}: {
  options: ProvisioningCriteriaLoanProduct[];
  value: ProvisioningCriteriaLoanProduct[];
  onChange: (value: ProvisioningCriteriaLoanProduct[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const selectedIds = new Set(value.map((product) => product.id));

  return (
    <Field>
      <FormLabel required>Loan products</FormLabel>
      <FieldContent>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {options.length ? (
            options.map((option) => {
              const checked = selectedIds.has(option.id);
              return (
                <label key={option.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) => {
                      if (next === true) {
                        onChange([...value, option]);
                        return;
                      }
                      onChange(value.filter((product) => product.id !== option.id));
                    }}
                  />
                  <span>{option.name}</span>
                </label>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No loan products available.</p>
          )}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}

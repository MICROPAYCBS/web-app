'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeListItem } from '@mifos/api-client';
import { FormLabel } from '@/components/composites/form-label';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError } from '@/components/ui/field';

export function HolidayOfficePicker({
  offices,
  value,
  onChange,
  error,
  disabled = false
}: {
  offices: FineractOfficeListItem[];
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const selected = new Set(value);

  return (
    <Field>
      <FormLabel required>Applicable branches</FormLabel>
      <FieldContent>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {offices.length ? (
            offices.map((office) => (
              <label key={office.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.has(office.id)}
                  disabled={disabled}
                  onCheckedChange={(next) => {
                    if (next === true) {
                      onChange([...value, office.id]);
                      return;
                    }
                    onChange(value.filter((entry) => entry !== office.id));
                  }}
                />
                <span>{office.nameDecorated ?? office.name}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No branches available.</p>
          )}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}

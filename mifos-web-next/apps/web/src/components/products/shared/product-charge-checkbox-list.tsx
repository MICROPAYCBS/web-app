'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Checkbox } from '@/components/ui/checkbox';
import {
  type ChargeAmountLike,
  formatProductChargeOptionLabel
} from '@/lib/fineract/charge-display';
import { cn } from '@/lib/utils';

export function ProductChargeCheckboxList({
  options,
  selected,
  idPrefix,
  currencyCode,
  onToggle
}: {
  options: ChargeAmountLike[];
  selected: Set<number>;
  idPrefix: string;
  currencyCode?: string;
  onToggle: (id: number, checked: boolean) => void;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">None available.</p>;
  }

  return (
    <ul className="space-y-2">
      {options.map((option) => {
        const id = option.id;
        if (id == null) {
          return null;
        }
        const controlId = `${idPrefix}-${id}`;
        const isChecked = selected.has(id);
        const label = formatProductChargeOptionLabel(option, currencyCode);

        return (
          <li key={id}>
            <label
              htmlFor={controlId}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border border-input px-3 py-2.5 transition-colors',
                isChecked && 'border-primary/40 bg-primary/5'
              )}
            >
              <Checkbox
                id={controlId}
                className="mt-0.5"
                checked={isChecked}
                onCheckedChange={(checked) => onToggle(id, checked === true)}
              />
              <span className="min-w-0 flex-1 text-sm leading-snug">{label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

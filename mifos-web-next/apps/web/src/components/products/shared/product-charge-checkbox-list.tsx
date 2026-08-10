'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type ChargeAmountLike,
  chargeAmountInputLabel,
  formatChargeAmountDisplay,
  formatProductChargeOptionLabel
} from '@/lib/fineract/charge-display';
import type { ProductChargeAmounts } from '@/lib/fineract/product-charge-links';
import { cn } from '@/lib/utils';

export function ProductChargeCheckboxList({
  options,
  selected,
  chargeAmounts,
  idPrefix,
  currencyCode,
  onToggle,
  onAmountChange
}: {
  options: ChargeAmountLike[];
  selected: Set<number>;
  chargeAmounts?: ProductChargeAmounts;
  idPrefix: string;
  currencyCode?: string;
  onToggle: (id: number, checked: boolean) => void;
  onAmountChange?: (id: number, amount: number | undefined) => void;
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
        const amountId = `${controlId}-amount`;
        const isChecked = selected.has(id);
        const tiered = option.useChargeTiers === true;
        const label = formatProductChargeOptionLabel(option, currencyCode);
        const override = chargeAmounts?.[String(id)];
        const amountLabel = chargeAmountInputLabel(option);
        const defaultLabel = formatChargeAmountDisplay(option, currencyCode);

        return (
          <li key={id}>
            <div
              className={cn(
                'rounded-lg border border-input px-3 py-2.5 transition-colors',
                isChecked && 'border-primary/40 bg-primary/5'
              )}
            >
              <label htmlFor={controlId} className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  id={controlId}
                  className="mt-0.5"
                  checked={isChecked}
                  onCheckedChange={(checked) => onToggle(id, checked === true)}
                />
                <span className="min-w-0 flex-1 text-sm leading-snug">{label}</span>
              </label>

              {isChecked && onAmountChange ? (
                <div className="mt-2 pl-8">
                  {tiered ? (
                    <p className="text-xs text-muted-foreground">
                      Tiered charge — product amount override is not available.
                    </p>
                  ) : (
                    <div className="grid max-w-xs gap-1.5">
                      <Label htmlFor={amountId} className="text-xs text-muted-foreground">
                        {amountLabel} override (optional)
                      </Label>
                      <Input
                        id={amountId}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        placeholder={defaultLabel === '—' ? 'Charge default' : defaultLabel}
                        value={override ?? ''}
                        onChange={(event) => {
                          const raw = event.target.value.trim();
                          if (!raw) {
                            onAmountChange(id, undefined);
                            return;
                          }
                          const next = Number(raw);
                          onAmountChange(id, Number.isFinite(next) && next > 0 ? next : undefined);
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ShareProductMarketPriceInput } from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import { DateField } from '@/components/composites/date-field';
import { DetailSection } from '@/components/composites';
import { MoneyField } from '@/components/composites/money-field';
import { Button } from '@/components/ui/button';
import type { ShareProductStepProps } from '../types';

type MarketPricePeriod = ShareProductMarketPriceInput['marketPricePeriods'][number];

export function MarketPriceStep({
  draft,
  errors,
  onChange
}: ShareProductStepProps & {
  onChange: (patch: Partial<ShareProductMarketPriceInput>) => void;
}) {
  const periods = draft.marketPrice.marketPricePeriods ?? [];
  const currencyCode = draft.currency.currencyCode || undefined;

  function updatePeriods(next: MarketPricePeriod[]) {
    onChange({ marketPricePeriods: next });
  }

  function addPeriod() {
    updatePeriods([...periods, { fromDate: '', shareValue: 0 }]);
  }

  function removePeriod(index: number) {
    updatePeriods(periods.filter((_, i) => i !== index));
  }

  function patchPeriod(index: number, patch: Partial<MarketPricePeriod>) {
    updatePeriods(periods.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Optional historical market prices for this share product. Incomplete rows are ignored when
        you save.
      </p>

      <DetailSection
        title="Market price periods"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={addPeriod}>
            <Plus className="mr-1 size-4" />
            Add period
          </Button>
        }
      >
        {periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">No market price periods added yet.</p>
        ) : (
          <ul className="space-y-4">
            {periods.map((period, index) => (
              <li
                key={index}
                className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto]"
              >
                <DateField
                  id={`marketPrice.marketPricePeriods.${index}.fromDate`}
                  label="From date"
                  required
                  allowFuture
                  value={period.fromDate || undefined}
                  onChange={(fromDate) => patchPeriod(index, { fromDate: fromDate ?? '' })}
                  error={errors[`marketPrice.marketPricePeriods.${index}.fromDate`]}
                />
                <MoneyField
                  id={`marketPrice.marketPricePeriods.${index}.shareValue`}
                  label="Nominal / unit price"
                  required
                  currencyCode={currencyCode}
                  value={period.shareValue > 0 ? String(period.shareValue) : ''}
                  onChange={(value) =>
                    patchPeriod(index, {
                      shareValue: value === '' ? 0 : Number(value)
                    })
                  }
                  error={errors[`marketPrice.marketPricePeriods.${index}.shareValue`]}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove period"
                    onClick={() => removePeriod(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}

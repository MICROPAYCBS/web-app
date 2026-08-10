'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductChargesInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { ProductChargeCheckboxList } from '@/components/products/shared/product-charge-checkbox-list';
import type { ChargeAmountLike } from '@/lib/fineract/charge-display';
import { pruneProductChargeAmounts } from '@/lib/fineract/product-charge-links';
import type { SavingsProductStepProps } from '../types';

function chargeOptions(template: SavingsProductStepProps['template']): ChargeAmountLike[] {
  return (template.chargeOptions ?? []).filter((option) => Number.isFinite(option.id));
}

export function ChargesStep({
  template,
  draft,
  onChange
}: SavingsProductStepProps & {
  onChange: (patch: Partial<SavingsProductChargesInput>) => void;
}) {
  const selected = new Set(draft.charges.chargeIds ?? []);
  const chargeAmounts = draft.charges.chargeAmounts ?? {};
  const options = chargeOptions(template);
  const currencyCode = draft.currency.currencyCode?.trim().toUpperCase();

  function toggle(id: number, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    const chargeIds = [...next];
    onChange({
      chargeIds,
      chargeAmounts: pruneProductChargeAmounts(chargeIds, chargeAmounts)
    });
  }

  function setAmount(id: number, amount: number | undefined) {
    const next = { ...chargeAmounts };
    if (amount == null) {
      delete next[String(id)];
    } else {
      next[String(id)] = amount;
    }
    onChange({ chargeAmounts: next });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select fees to attach to this deposit product. Optionally override the charge amount for
        this product (not available for tiered charges).
        {currencyCode
          ? ` Only charges in ${currencyCode} are shown.`
          : ' Choose a currency on the previous step to see matching charges.'}
      </p>

      {!currencyCode ? (
        <p className="text-sm text-muted-foreground">Select a currency before choosing charges.</p>
      ) : (
        <DetailSection title="Fees">
          <ProductChargeCheckboxList
            options={options}
            selected={selected}
            chargeAmounts={chargeAmounts}
            idPrefix="charges"
            currencyCode={currencyCode}
            onToggle={toggle}
            onAmountChange={setAmount}
          />
        </DetailSection>
      )}
    </div>
  );
}

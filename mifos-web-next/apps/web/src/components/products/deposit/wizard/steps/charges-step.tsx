'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { DepositProductChargesInput } from '@mifos/validation';

import { DetailSection } from '@/components/composites';

import { ProductChargeCheckboxList } from '@/components/products/shared/product-charge-checkbox-list';

import type { ChargeAmountLike } from '@/lib/fineract/charge-display';

import type { DepositProductStepProps } from '../types';



function feeOptions(template: DepositProductStepProps['template']): ChargeAmountLike[] {

  return (template.chargeOptions ?? []).filter((option) => Number.isFinite(option.id));

}



function penaltyOptions(template: DepositProductStepProps['template']): ChargeAmountLike[] {

  return (template.penaltyOptions ?? []).filter((option) => Number.isFinite(option.id));

}



export function ChargesStep({

  template,

  draft,

  onChange

}: DepositProductStepProps & {

  onChange: (patch: Partial<DepositProductChargesInput>) => void;

}) {

  const selected = new Set(draft.charges.chargeIds ?? []);

  const fees = feeOptions(template);

  const penalties = penaltyOptions(template);

  const hasOptions = fees.length > 0 || penalties.length > 0;

  const currencyCode = draft.currency.currencyCode?.trim().toUpperCase();



  function toggleCharge(id: number, checked: boolean) {

    const next = new Set(selected);

    if (checked) {

      next.add(id);

    } else {

      next.delete(id);

    }

    onChange({ chargeIds: [...next] });

  }



  return (

    <div className="space-y-6">

      <p className="text-sm text-muted-foreground">

        Select fees and penalties to attach to this product. You can skip this step if none apply.

        {currencyCode

          ? ` Only charges in ${currencyCode} are shown.`

          : ' Choose a currency on the previous step to see matching charges.'}

      </p>



      {!currencyCode ? (

        <p className="text-sm text-muted-foreground">Select a currency before choosing charges.</p>

      ) : !hasOptions ? (

        <p className="text-sm text-muted-foreground">No fees or penalties are available.</p>

      ) : (

        <div className="space-y-6">

          <DetailSection title="Fees">

            <ProductChargeCheckboxList

              options={fees}

              selected={selected}

              idPrefix="deposit-product-fee"

              currencyCode={currencyCode}

              onToggle={toggleCharge}

            />

          </DetailSection>



          <DetailSection title="Penalties">

            <ProductChargeCheckboxList

              options={penalties}

              selected={selected}

              idPrefix="deposit-product-penalty"

              currencyCode={currencyCode}

              onToggle={toggleCharge}

            />

          </DetailSection>

        </div>

      )}

    </div>

  );

}



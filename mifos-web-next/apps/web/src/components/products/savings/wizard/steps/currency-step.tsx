'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductCurrencyInput } from '@mifos/validation';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import {
  optionalMultipleFieldValue,
  parseOptionalMultipleFieldValue
} from '@/lib/fineract/product-currency-form';
import type { SavingsProductStepProps } from '../types';

function currencySelectOptions(
  template: SavingsProductStepProps['template']
): { value: string; label: string }[] {
  return (template.currencyOptions ?? []).map((currency) => ({
    value: currency.code ?? '',
    label: currency.name ? `${currency.name} (${currency.code})` : (currency.code ?? '')
  }));
}

export function CurrencyStep({
  template,
  draft,
  errors,
  onChange
}: SavingsProductStepProps & {
  onChange: (patch: Partial<SavingsProductCurrencyInput>) => void;
}) {
  const currency = draft.currency;
  const options = currencySelectOptions(template);

  function handleCurrencyChange(code: string | undefined) {
    if (!code) {
      onChange({ currencyCode: '' });
      return;
    }
    const selected = template.currencyOptions?.find((item) => item.code === code);
    onChange({
      currencyCode: code,
      digitsAfterDecimal: selected?.decimalPlaces ?? currency.digitsAfterDecimal
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Currency and rounding rules for savings amounts on this product.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="currency.currencyCode"
          label="Currency"
          required
          value={currency.currencyCode || undefined}
          onValueChange={handleCurrencyChange}
          options={options}
          error={errors['currency.currencyCode']}
        />
        <NumericField
          id="currency.digitsAfterDecimal"
          label="Decimal places"
          required
          integer
          value={String(currency.digitsAfterDecimal ?? '')}
          onChange={(value) =>
            onChange({ digitsAfterDecimal: value === '' ? undefined : Number(value) })
          }
          error={errors['currency.digitsAfterDecimal']}
        />
        <NumericField
          id="currency.inMultiplesOf"
          label="Currency in multiples of"
          optional
          integer
          value={optionalMultipleFieldValue(currency.inMultiplesOf)}
          onChange={(value) =>
            onChange({ inMultiplesOf: parseOptionalMultipleFieldValue(value) })
          }
          error={errors['currency.inMultiplesOf']}
        />
      </div>
    </div>
  );
}

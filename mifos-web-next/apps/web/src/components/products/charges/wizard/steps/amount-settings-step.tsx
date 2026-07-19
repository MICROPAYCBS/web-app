'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeWizardDraft } from '../types';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { isFlatChargeCalculation } from '@/lib/fineract/charge-display';
import {
  incomeAccountOptions,
  penaltyDisabled,
  showIncomeAccountField,
  showMinMaxCap,
  showTaxGroupField
} from '@/lib/fineract/charge-form-logic';
import { glAccountLabel } from '@/lib/fineract/product-display';
import { useDraftNumericInput } from '@/lib/form/use-draft-numeric-input';
import type { ChargeStepProps } from '../types';

export function AmountSettingsStep({
  mode,
  template,
  draft,
  errors,
  onChange
}: ChargeStepProps & {
  onChange: (patch: Partial<ChargeWizardDraft>) => void;
}) {
  const currencyCode = draft.currencyCode || undefined;
  const chargeAppliesTo = draft.chargeAppliesTo;
  const chargeTimeType = draft.chargeTimeType;
  const chargeCalculationType = draft.chargeCalculationType;
  const taxLocked = mode === 'edit' && Boolean(template.taxGroup?.id);
  const flatAmount = isFlatChargeCalculation(chargeCalculationType);
  const amountResetKey = `${chargeCalculationType ?? ''}-${flatAmount}`;

  const amount = useDraftNumericInput(
    draft.amount,
    (value) => onChange({ amount: value }),
    amountResetKey
  );
  const minCap = useDraftNumericInput(
    draft.minCap,
    (value) => onChange({ minCap: value }),
    amountResetKey
  );
  const maxCap = useDraftNumericInput(
    draft.maxCap,
    (value) => onChange({ maxCap: value }),
    amountResetKey
  );

  const glOptions = incomeAccountOptions(template).map((account) => ({
    value: String(account.id),
    label: glAccountLabel(account)
  }));
  const taxOptions = (template.taxGroupOptions ?? []).map((group) => ({
    value: String(group.id),
    label: group.name ?? String(group.id)
  }));

  const capFields = flatAmount ? (
    <>
      <MoneyField
        id="minCap"
        label="Minimum charge cap"
        optional
        currencyCode={currencyCode}
        value={minCap.input}
        onChange={minCap.onInputChange}
        onBlur={minCap.onInputBlur}
        error={errors.minCap}
      />
      <MoneyField
        id="maxCap"
        label="Maximum charge cap"
        optional
        currencyCode={currencyCode}
        value={maxCap.input}
        onChange={maxCap.onInputChange}
        onBlur={maxCap.onInputBlur}
        error={errors.maxCap}
      />
    </>
  ) : (
    <>
      <NumericField
        id="minCap"
        label="Minimum charge cap (%)"
        optional
        value={minCap.input}
        onChange={minCap.onInputChange}
        onBlur={minCap.onInputBlur}
        error={errors.minCap}
        maxDecimalPlaces={6}
      />
      <NumericField
        id="maxCap"
        label="Maximum charge cap (%)"
        optional
        value={maxCap.input}
        onChange={maxCap.onInputChange}
        onBlur={maxCap.onInputBlur}
        error={errors.maxCap}
        maxDecimalPlaces={6}
      />
    </>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set the charge amount, optional caps, accounting links, and status flags.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {flatAmount ? (
          <MoneyField
            id="amount"
            label="Amount"
            required
            currencyCode={currencyCode}
            value={amount.input}
            onChange={amount.onInputChange}
            onBlur={amount.onInputBlur}
            error={errors.amount}
          />
        ) : (
          <NumericField
            id="amount"
            label="Amount (%)"
            required
            value={amount.input}
            onChange={amount.onInputChange}
            onBlur={amount.onInputBlur}
            error={errors.amount}
            hint="Percentage of the base amount, e.g. 0.5 for 0.5%."
            placeholder="0.5"
            maxDecimalPlaces={6}
          />
        )}
        {showMinMaxCap(chargeAppliesTo, chargeTimeType, chargeCalculationType) ? capFields : null}
        {showIncomeAccountField(chargeAppliesTo) ? (
          <SelectField
            id="incomeAccountId"
            label="Income from charge"
            required
            value={draft.incomeAccountId != null ? String(draft.incomeAccountId) : undefined}
            onValueChange={(value) =>
              onChange({ incomeAccountId: value ? Number(value) : undefined })
            }
            options={glOptions}
            error={errors.incomeAccountId}
          />
        ) : null}
        {showTaxGroupField(chargeAppliesTo) ? (
          <SelectField
            id="taxGroupId"
            label="Tax group"
            optional
            value={
              taxLocked && template.taxGroup?.id
                ? String(template.taxGroup.id)
                : draft.taxGroupId != null
                  ? String(draft.taxGroupId)
                  : undefined
            }
            onValueChange={(value) =>
              onChange({ taxGroupId: value ? Number(value) : undefined })
            }
            options={taxOptions}
            error={errors.taxGroupId}
            disabled={taxLocked}
          />
        ) : null}
        <SwitchField
          id="active"
          label="Active"
          checked={draft.active ?? false}
          onCheckedChange={(active) => onChange({ active })}
        />
        <SwitchField
          id="penalty"
          label="Penalty"
          checked={draft.penalty ?? false}
          onCheckedChange={(penalty) => onChange({ penalty })}
          disabled={penaltyDisabled(chargeAppliesTo) || chargeTimeType === 9}
        />
      </div>
    </div>
  );
}

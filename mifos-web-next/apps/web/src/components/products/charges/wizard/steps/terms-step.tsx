'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeWizardDraft } from '../types';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import {
  chargePaymentModeOptions,
  chargeTimeTypeOptions,
  filteredChargeCalculationTypeOptions,
  isChargeTiersAllowed,
  showChargePaymentMode
} from '@/lib/fineract/charge-form-logic';
import { toSelectOptions } from '@/lib/form/select-options';
import type { ChargeStepProps } from '../types';

export function TermsStep({
  template,
  draft,
  errors,
  onChange
}: ChargeStepProps & {
  onChange: (patch: Partial<ChargeWizardDraft>) => void;
}) {
  const chargeAppliesTo = draft.chargeAppliesTo;
  const chargeTimeType = draft.chargeTimeType;
  const timeOptions = toSelectOptions(chargeTimeTypeOptions(template, chargeAppliesTo));
  const calculationOptions = toSelectOptions(
    filteredChargeCalculationTypeOptions(template, chargeAppliesTo, chargeTimeType)
  );
  const paymentModeOptions = toSelectOptions(
    chargePaymentModeOptions(template, chargeAppliesTo)
  );
  const currencyOptions = (template.currencyOptions ?? []).map((currency) => ({
    value: currency.code ?? '',
    label: currency.name ? `${currency.name} (${currency.code})` : (currency.code ?? '')
  }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Name the charge and define when and how it is calculated.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="name"
          label="Name"
          required
          value={draft.name ?? ''}
          onChange={(name) => onChange({ name })}
          error={errors.name}
        />
        <SelectField
          id="currencyCode"
          label="Currency"
          required
          value={draft.currencyCode || undefined}
          onValueChange={(currencyCode) => onChange({ currencyCode: currencyCode ?? '' })}
          options={currencyOptions}
          error={errors.currencyCode}
        />
        <SelectField
          id="chargeTimeType"
          label="Charge time type"
          required
          value={chargeTimeType != null ? String(chargeTimeType) : undefined}
          onValueChange={(value) => {
            const nextTimeType = value ? Number(value) : undefined;
            const patch: Partial<ChargeWizardDraft> = {
              chargeTimeType: nextTimeType,
              chargeCalculationType: undefined,
              feeInterval: undefined,
              feeFrequency: undefined,
              feeOnMonthDay: undefined,
              addFeeFrequency: false
            };
            if (!isChargeTiersAllowed(chargeAppliesTo, nextTimeType)) {
              patch.useChargeTiers = false;
              patch.chargeTiers = [];
            }
            onChange(patch);
          }}
          options={timeOptions}
          error={errors.chargeTimeType}
        />
        <SelectField
          id="chargeCalculationType"
          label="Calculation type"
          required
          value={
            draft.chargeCalculationType != null
              ? String(draft.chargeCalculationType)
              : undefined
          }
          onValueChange={(value) =>
            onChange({
              chargeCalculationType: value ? Number(value) : undefined,
              // Keep parent amount at 0 when tiers stay enabled (Amount field is hidden).
              amount: draft.useChargeTiers ? 0 : undefined,
              minCap: undefined,
              maxCap: undefined
            })
          }
          options={calculationOptions}
          error={errors.chargeCalculationType}
        />
        {showChargePaymentMode(chargeAppliesTo) ? (
          <SelectField
            id="chargePaymentMode"
            label="Payment mode"
            required
            value={
              draft.chargePaymentMode != null ? String(draft.chargePaymentMode) : undefined
            }
            onValueChange={(value) =>
              onChange({ chargePaymentMode: value ? Number(value) : undefined })
            }
            options={paymentModeOptions}
            error={errors.chargePaymentMode}
          />
        ) : null}
        {chargeTimeType === 9 ? (
          <SwitchField
            id="addFeeFrequency"
            label="Add fee frequency"
            checked={draft.addFeeFrequency ?? false}
            onCheckedChange={(addFeeFrequency) => onChange({ addFeeFrequency })}
          />
        ) : null}
        {chargeTimeType === 9 && draft.addFeeFrequency ? (
          <>
            <SelectField
              id="feeFrequency"
              label="Charge frequency"
              required
              value={draft.feeFrequency != null ? String(draft.feeFrequency) : undefined}
              onValueChange={(value) =>
                onChange({ feeFrequency: value ? Number(value) : undefined })
              }
              options={toSelectOptions(template.feeFrequencyOptions)}
              error={errors.feeFrequency}
            />
            <NumericField
              id="feeInterval"
              label="Frequency interval"
              required
              integer
              value={draft.feeInterval != null ? String(draft.feeInterval) : ''}
              onChange={(value) =>
                onChange({ feeInterval: value === '' ? undefined : Number(value) })
              }
              error={errors.feeInterval}
            />
          </>
        ) : null}
        {chargeTimeType === 6 || chargeTimeType === 7 ? (
          <TextField
            id="feeOnMonthDay"
            label="Due date"
            required={chargeTimeType === 6}
            optional={chargeTimeType === 7}
            value={draft.feeOnMonthDay ?? ''}
            onChange={(feeOnMonthDay) => onChange({ feeOnMonthDay })}
            placeholder="06 Jun"
            hint="Day and month, e.g. 06 Jun"
            error={errors.feeOnMonthDay}
          />
        ) : null}
        {chargeTimeType === 7 || chargeTimeType === 11 ? (
          <NumericField
            id="feeIntervalRepeat"
            label={chargeTimeType === 7 ? 'Repeat every (months)' : 'Repeat every (weeks)'}
            required
            integer
            value={draft.feeInterval != null ? String(draft.feeInterval) : ''}
            onChange={(value) =>
              onChange({ feeInterval: value === '' ? undefined : Number(value) })
            }
            error={errors.feeInterval}
          />
        ) : null}
      </div>
    </div>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountTemplate } from '@mifos/api-client';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { Separator } from '@/components/ui/separator';
import type { SavingsAccountFormState } from '@/components/clients/accounts/create-client-deposit-account-form-state';
import { toSelectOptions } from '@/lib/form/select-options';

export function CreateClientSavingsAccountAdvancedFields({
  form,
  template,
  productSelected,
  disabled,
  fieldErrors,
  onPatch
}: {
  form: SavingsAccountFormState;
  template: ClientDepositAccountTemplate;
  productSelected: boolean;
  disabled: boolean;
  fieldErrors: Record<string, string>;
  onPatch: (patch: Partial<SavingsAccountFormState>) => void;
}) {
  const currencyCode = template.currency?.code;
  const showTerms = productSelected && Boolean(currencyCode);

  return (
    <div className="space-y-4">
      <TextField
        id="savings-external-id"
        label="External ID"
        optional
        value={form.externalId}
        onChange={(externalId) => onPatch({ externalId })}
        disabled={disabled}
        error={fieldErrors.externalId}
      />

      {!productSelected ? (
        <p className="text-sm text-muted-foreground">
          Select a product on Basic to configure interest and balance options.
        </p>
      ) : null}

      {showTerms ? (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground">
            Terms default from the product. Override only when this application needs different
            settings.
          </p>

          {currencyCode ? (
            <TextField
              id="savings-currency"
              label="Currency"
              value={currencyCode}
              onChange={() => undefined}
              disabled
            />
          ) : null}

          <NumericField
            id="savings-nominal-interest"
            label="Nominal annual interest (%)"
            optional
            value={form.nominalAnnualInterestRate}
            onChange={(nominalAnnualInterestRate) => onPatch({ nominalAnnualInterestRate })}
            disabled={disabled}
            error={fieldErrors.nominalAnnualInterestRate}
          />

          <SelectField
            label="Interest compounding period"
            optional
            value={form.interestCompoundingPeriodType || undefined}
            onValueChange={(value) => onPatch({ interestCompoundingPeriodType: value ?? '' })}
            options={toSelectOptions(template.interestCompoundingPeriodTypeOptions)}
            placeholder="From product"
            disabled={disabled}
            error={fieldErrors.interestCompoundingPeriodType}
          />

          <SelectField
            label="Interest posting period"
            optional
            value={form.interestPostingPeriodType || undefined}
            onValueChange={(value) => onPatch({ interestPostingPeriodType: value ?? '' })}
            options={toSelectOptions(template.interestPostingPeriodTypeOptions)}
            placeholder="From product"
            disabled={disabled}
            error={fieldErrors.interestPostingPeriodType}
          />

          <SelectField
            label="Interest calculated using"
            optional
            value={form.interestCalculationType || undefined}
            onValueChange={(value) => onPatch({ interestCalculationType: value ?? '' })}
            options={toSelectOptions(template.interestCalculationTypeOptions)}
            placeholder="From product"
            disabled={disabled}
            error={fieldErrors.interestCalculationType}
          />

          <SelectField
            label="Days in year"
            optional
            value={form.interestCalculationDaysInYearType || undefined}
            onValueChange={(value) => onPatch({ interestCalculationDaysInYearType: value ?? '' })}
            options={toSelectOptions(template.interestCalculationDaysInYearTypeOptions)}
            placeholder="From product"
            disabled={disabled}
            error={fieldErrors.interestCalculationDaysInYearType}
          />

          <NumericField
            id="savings-min-opening-balance"
            label="Minimum opening balance"
            optional
            value={form.minRequiredOpeningBalance}
            onChange={(minRequiredOpeningBalance) => onPatch({ minRequiredOpeningBalance })}
            disabled={disabled}
            error={fieldErrors.minRequiredOpeningBalance}
          />

          <SwitchField
            id="savings-withdrawal-fee-transfers"
            label="Apply withdrawal fee for transfers"
            checked={form.withdrawalFeeForTransfers}
            onCheckedChange={(withdrawalFeeForTransfers) => onPatch({ withdrawalFeeForTransfers })}
            disabled={disabled}
          />

          <div className="space-y-4">
            <p className="text-sm font-medium">Lock-in period</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumericField
                id="savings-lockin-frequency"
                label="Frequency"
                optional
                integer
                value={form.lockinPeriodFrequency}
                onChange={(lockinPeriodFrequency) => onPatch({ lockinPeriodFrequency })}
                disabled={disabled}
                error={fieldErrors.lockinPeriodFrequency}
              />
              <SelectField
                label="Type"
                optional
                value={form.lockinPeriodFrequencyType || undefined}
                onValueChange={(value) => onPatch({ lockinPeriodFrequencyType: value ?? '' })}
                options={toSelectOptions(template.lockinPeriodFrequencyTypeOptions)}
                placeholder="From product"
                disabled={disabled}
                error={fieldErrors.lockinPeriodFrequencyType}
              />
            </div>
          </div>

          <Separator />

          <SwitchField
            id="savings-allow-overdraft"
            label="Overdraft allowed"
            checked={form.allowOverdraft}
            onCheckedChange={(allowOverdraft) => onPatch({ allowOverdraft })}
            disabled={disabled}
          />

          {form.allowOverdraft ? (
            <div className="space-y-4">
              <NumericField
                id="savings-overdraft-limit"
                label="Maximum overdraft limit"
                optional
                value={form.overdraftLimit}
                onChange={(overdraftLimit) => onPatch({ overdraftLimit })}
                disabled={disabled}
                error={fieldErrors.overdraftLimit}
              />
              <NumericField
                id="savings-min-overdraft-interest"
                label="Minimum overdraft for interest calculation"
                optional
                value={form.minOverdraftForInterestCalculation}
                onChange={(minOverdraftForInterestCalculation) =>
                  onPatch({ minOverdraftForInterestCalculation })
                }
                disabled={disabled}
                error={fieldErrors.minOverdraftForInterestCalculation}
              />
              <NumericField
                id="savings-overdraft-interest"
                label="Nominal annual interest on overdraft (%)"
                optional
                value={form.nominalAnnualInterestRateOverdraft}
                onChange={(nominalAnnualInterestRateOverdraft) =>
                  onPatch({ nominalAnnualInterestRateOverdraft })
                }
                disabled={disabled}
                error={fieldErrors.nominalAnnualInterestRateOverdraft}
              />
            </div>
          ) : null}

          <SwitchField
            id="savings-enforce-min-balance"
            label="Enforce minimum balance"
            checked={form.enforceMinRequiredBalance}
            onCheckedChange={(enforceMinRequiredBalance) => onPatch({ enforceMinRequiredBalance })}
            disabled={disabled}
          />

          <NumericField
            id="savings-min-balance"
            label="Minimum balance"
            optional
            value={form.minRequiredBalance}
            onChange={(minRequiredBalance) => onPatch({ minRequiredBalance })}
            disabled={disabled}
            error={fieldErrors.minRequiredBalance}
          />
        </>
      ) : null}
    </div>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductSettingsInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import {
  SAVINGS_PRODUCT_ALLOW_OVERDRAFT_HINT,
  SAVINGS_PRODUCT_DAYS_TO_DORMANCY_HINT,
  SAVINGS_PRODUCT_DAYS_TO_ESCHEAT_HINT,
  SAVINGS_PRODUCT_DAYS_TO_INACTIVE_HINT,
  SAVINGS_PRODUCT_DORMANCY_TRACKING_HINT,
  SAVINGS_PRODUCT_ENABLE_LOCKIN_HINT,
  SAVINGS_PRODUCT_ENFORCE_MIN_BALANCE_HINT,
  SAVINGS_PRODUCT_LOCKIN_FREQUENCY_HINT,
  SAVINGS_PRODUCT_LOCKIN_PERIOD_TYPE_HINT,
  SAVINGS_PRODUCT_MIN_BALANCE_FOR_INTEREST_HINT,
  SAVINGS_PRODUCT_MIN_OPENING_BALANCE_HINT,
  SAVINGS_PRODUCT_MIN_OVERDRAFT_FOR_INTEREST_HINT,
  SAVINGS_PRODUCT_MIN_REQUIRED_BALANCE_HINT,
  SAVINGS_PRODUCT_OVERDRAFT_INTEREST_RATE_HINT,
  SAVINGS_PRODUCT_OVERDRAFT_LIMIT_HINT,
  SAVINGS_PRODUCT_TAX_GROUP_HINT,
  SAVINGS_PRODUCT_WITHDRAWAL_FEE_FOR_TRANSFERS_HINT,
  SAVINGS_PRODUCT_WITHHOLD_TAX_HINT
} from '@/lib/fineract/savings-product-field-hints';
import { toSelectOptions } from '@/lib/form/select-options';
import type { SavingsProductStepProps } from '../types';

export function SettingsStep({
  template,
  draft,
  errors,
  onChange
}: SavingsProductStepProps & {
  onChange: (patch: Partial<SavingsProductSettingsInput>) => void;
}) {
  const settings = draft.settings;
  const currencyCode = draft.currency.currencyCode || undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Balances, lock-in, overdraft, tax, and dormancy settings.
      </p>

      <DetailSection title="Balances">
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            id="settings.minRequiredOpeningBalance"
            label="Minimum opening balance"
            optional
            hint={SAVINGS_PRODUCT_MIN_OPENING_BALANCE_HINT}
            hintAriaLabel="About minimum opening balance"
            currencyCode={currencyCode}
            value={
              settings.minRequiredOpeningBalance != null
                ? String(settings.minRequiredOpeningBalance)
                : ''
            }
            onChange={(value) =>
              onChange({
                minRequiredOpeningBalance: value === '' ? undefined : Number(value)
              })
            }
            error={errors['settings.minRequiredOpeningBalance']}
          />
          <MoneyField
            id="settings.minBalanceForInterestCalculation"
            label="Minimum balance for interest"
            optional
            hint={SAVINGS_PRODUCT_MIN_BALANCE_FOR_INTEREST_HINT}
            hintAriaLabel="About minimum balance for interest"
            currencyCode={currencyCode}
            value={
              settings.minBalanceForInterestCalculation != null
                ? String(settings.minBalanceForInterestCalculation)
                : ''
            }
            onChange={(value) =>
              onChange({
                minBalanceForInterestCalculation: value === '' ? undefined : Number(value)
              })
            }
            error={errors['settings.minBalanceForInterestCalculation']}
          />
          <SwitchField
            id="settings.enforceMinRequiredBalance"
            label="Enforce minimum required balance"
            description={SAVINGS_PRODUCT_ENFORCE_MIN_BALANCE_HINT}
            checked={settings.enforceMinRequiredBalance ?? false}
            onCheckedChange={(enforceMinRequiredBalance) =>
              onChange({ enforceMinRequiredBalance })
            }
            error={errors['settings.enforceMinRequiredBalance']}
          />
          {settings.enforceMinRequiredBalance ? (
            <MoneyField
              id="settings.minRequiredBalance"
              label="Minimum required balance"
              optional
              hint={SAVINGS_PRODUCT_MIN_REQUIRED_BALANCE_HINT}
              hintAriaLabel="About minimum required balance"
              currencyCode={currencyCode}
              value={
                settings.minRequiredBalance != null
                  ? String(settings.minRequiredBalance)
                  : ''
              }
              onChange={(value) =>
                onChange({
                  minRequiredBalance: value === '' ? undefined : Number(value)
                })
              }
              error={errors['settings.minRequiredBalance']}
            />
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="Lock-in">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.enableLockinPeriod"
            label="Enable lock-in period"
            description={SAVINGS_PRODUCT_ENABLE_LOCKIN_HINT}
            checked={settings.enableLockinPeriod ?? false}
            onCheckedChange={(enableLockinPeriod) => {
              if (!enableLockinPeriod) {
                onChange({
                  enableLockinPeriod: false,
                  lockinPeriodFrequency: undefined,
                  lockinPeriodFrequencyType: undefined
                });
              } else {
                onChange({ enableLockinPeriod: true });
              }
            }}
            error={errors['settings.enableLockinPeriod']}
          />
          {settings.enableLockinPeriod ? (
            <>
              <NumericField
                id="settings.lockinPeriodFrequency"
                label="Lock-in frequency"
                required
                integer
                hint={SAVINGS_PRODUCT_LOCKIN_FREQUENCY_HINT}
                hintAriaLabel="About lock-in frequency"
                value={
                  settings.lockinPeriodFrequency != null
                    ? String(settings.lockinPeriodFrequency)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    lockinPeriodFrequency: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.lockinPeriodFrequency']}
              />
              <SelectField
                id="settings.lockinPeriodFrequencyType"
                label="Lock-in period type"
                required
                hint={SAVINGS_PRODUCT_LOCKIN_PERIOD_TYPE_HINT}
                hintAriaLabel="About lock-in period type"
                value={
                  settings.lockinPeriodFrequencyType != null
                    ? String(settings.lockinPeriodFrequencyType)
                    : undefined
                }
                onValueChange={(value) =>
                  onChange({
                    lockinPeriodFrequencyType: value ? Number(value) : undefined
                  })
                }
                options={toSelectOptions(template.lockinPeriodFrequencyTypeOptions)}
                error={errors['settings.lockinPeriodFrequencyType']}
              />
            </>
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="Overdraft">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.withdrawalFeeForTransfers"
            label="Withdrawal fee for transfers"
            description={SAVINGS_PRODUCT_WITHDRAWAL_FEE_FOR_TRANSFERS_HINT}
            checked={settings.withdrawalFeeForTransfers ?? false}
            onCheckedChange={(withdrawalFeeForTransfers) =>
              onChange({ withdrawalFeeForTransfers })
            }
            error={errors['settings.withdrawalFeeForTransfers']}
          />
          <SwitchField
            id="settings.allowOverdraft"
            label="Allow overdraft"
            description={SAVINGS_PRODUCT_ALLOW_OVERDRAFT_HINT}
            checked={settings.allowOverdraft ?? false}
            onCheckedChange={(allowOverdraft) => {
              if (!allowOverdraft) {
                onChange({
                  allowOverdraft: false,
                  minOverdraftForInterestCalculation: undefined,
                  nominalAnnualInterestRateOverdraft: undefined,
                  overdraftLimit: undefined
                });
              } else {
                onChange({ allowOverdraft: true });
              }
            }}
            error={errors['settings.allowOverdraft']}
          />
          {settings.allowOverdraft ? (
            <>
              <MoneyField
                id="settings.overdraftLimit"
                label="Overdraft limit"
                optional
                hint={SAVINGS_PRODUCT_OVERDRAFT_LIMIT_HINT}
                hintAriaLabel="About overdraft limit"
                currencyCode={currencyCode}
                value={
                  settings.overdraftLimit != null ? String(settings.overdraftLimit) : ''
                }
                onChange={(value) =>
                  onChange({ overdraftLimit: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.overdraftLimit']}
              />
              <MoneyField
                id="settings.minOverdraftForInterestCalculation"
                label="Minimum overdraft for interest"
                optional
                hint={SAVINGS_PRODUCT_MIN_OVERDRAFT_FOR_INTEREST_HINT}
                hintAriaLabel="About minimum overdraft for interest"
                currencyCode={currencyCode}
                value={
                  settings.minOverdraftForInterestCalculation != null
                    ? String(settings.minOverdraftForInterestCalculation)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    minOverdraftForInterestCalculation:
                      value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.minOverdraftForInterestCalculation']}
              />
              <NumericField
                id="settings.nominalAnnualInterestRateOverdraft"
                label="Nominal annual interest rate (overdraft)"
                optional
                hint={SAVINGS_PRODUCT_OVERDRAFT_INTEREST_RATE_HINT}
                hintAriaLabel="About overdraft interest rate"
                value={
                  settings.nominalAnnualInterestRateOverdraft != null
                    ? String(settings.nominalAnnualInterestRateOverdraft)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    nominalAnnualInterestRateOverdraft:
                      value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.nominalAnnualInterestRateOverdraft']}
              />
            </>
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="Tax and dormancy">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.withHoldTax"
            label="Withhold tax"
            description={SAVINGS_PRODUCT_WITHHOLD_TAX_HINT}
            checked={settings.withHoldTax ?? false}
            onCheckedChange={(withHoldTax) => {
              if (!withHoldTax) {
                onChange({ withHoldTax: false, taxGroupId: undefined });
              } else {
                onChange({ withHoldTax: true });
              }
            }}
            error={errors['settings.withHoldTax']}
          />
          {settings.withHoldTax ? (
            <SelectField
              id="settings.taxGroupId"
              label="Tax group"
              required
              hint={SAVINGS_PRODUCT_TAX_GROUP_HINT}
              hintAriaLabel="About tax group"
              value={settings.taxGroupId ? String(settings.taxGroupId) : undefined}
              onValueChange={(value) =>
                onChange({ taxGroupId: value ? Number(value) : undefined })
              }
              options={toSelectOptions(template.taxGroupOptions)}
              error={errors['settings.taxGroupId']}
            />
          ) : null}
          <SwitchField
            id="settings.isDormancyTrackingActive"
            label="Dormancy tracking"
            description={SAVINGS_PRODUCT_DORMANCY_TRACKING_HINT}
            checked={settings.isDormancyTrackingActive ?? false}
            onCheckedChange={(isDormancyTrackingActive) => {
              if (!isDormancyTrackingActive) {
                onChange({
                  isDormancyTrackingActive: false,
                  daysToInactive: undefined,
                  daysToDormancy: undefined,
                  daysToEscheat: undefined
                });
              } else {
                onChange({ isDormancyTrackingActive: true });
              }
            }}
            error={errors['settings.isDormancyTrackingActive']}
          />
          {settings.isDormancyTrackingActive ? (
            <>
              <NumericField
                id="settings.daysToInactive"
                label="Days to inactive"
                required
                integer
                hint={SAVINGS_PRODUCT_DAYS_TO_INACTIVE_HINT}
                hintAriaLabel="About days to inactive"
                value={settings.daysToInactive != null ? String(settings.daysToInactive) : ''}
                onChange={(value) =>
                  onChange({ daysToInactive: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.daysToInactive']}
              />
              <NumericField
                id="settings.daysToDormancy"
                label="Days to dormancy"
                required
                integer
                hint={SAVINGS_PRODUCT_DAYS_TO_DORMANCY_HINT}
                hintAriaLabel="About days to dormancy"
                value={settings.daysToDormancy != null ? String(settings.daysToDormancy) : ''}
                onChange={(value) =>
                  onChange({ daysToDormancy: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.daysToDormancy']}
              />
              <NumericField
                id="settings.daysToEscheat"
                label="Days to escheat"
                required
                integer
                hint={SAVINGS_PRODUCT_DAYS_TO_ESCHEAT_HINT}
                hintAriaLabel="About days to escheat"
                value={settings.daysToEscheat != null ? String(settings.daysToEscheat) : ''}
                onChange={(value) =>
                  onChange({ daysToEscheat: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.daysToEscheat']}
              />
            </>
          ) : null}
        </div>
      </DetailSection>
    </div>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DepositProductSettingsInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { toSelectOptions } from '@/lib/form/select-options';
import type { DepositProductStepProps } from '../types';

function periodTypeOptions(template: DepositProductStepProps['template']) {
  return toSelectOptions(template.periodFrequencyTypeOptions?.slice(0, -1));
}

export function SettingsStep({
  config,
  template,
  draft,
  errors,
  onChange
}: DepositProductStepProps & {
  onChange: (patch: Partial<DepositProductSettingsInput>) => void;
}) {
  const settings = draft.settings;
  const periodOptions = periodTypeOptions(template);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Deposit term, lock-in, pre-closure penalty, and tax settings.
      </p>

      {config.isRecurring ? (
        <DetailSection title="Recurring deposit">
          <div className="grid gap-4 sm:grid-cols-2">
            <SwitchField
              id="settings.isMandatoryDeposit"
              label="Mandatory deposit"
              checked={settings.isMandatoryDeposit ?? false}
              onCheckedChange={(isMandatoryDeposit) => onChange({ isMandatoryDeposit })}
            />
            <SwitchField
              id="settings.adjustAdvanceTowardsFuturePayments"
              label="Adjust advance towards future payments"
              checked={settings.adjustAdvanceTowardsFuturePayments ?? false}
              onCheckedChange={(adjustAdvanceTowardsFuturePayments) =>
                onChange({ adjustAdvanceTowardsFuturePayments })
              }
            />
            <SwitchField
              id="settings.allowWithdrawal"
              label="Allow withdrawal"
              checked={settings.allowWithdrawal ?? false}
              onCheckedChange={(allowWithdrawal) => onChange({ allowWithdrawal })}
            />
          </div>
        </DetailSection>
      ) : null}

      <DetailSection title="Lock-in period">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.enableLockinPeriod"
            label="Enable lock-in period"
            checked={settings.enableLockinPeriod ?? false}
            onCheckedChange={(enableLockinPeriod) => onChange({ enableLockinPeriod })}
          />
          {settings.enableLockinPeriod ? (
            <>
              <NumericField
                id="settings.lockinPeriodFrequency"
                label="Lock-in frequency"
                required
                integer
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

      <DetailSection title="Deposit term">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            id="settings.minDepositTerm"
            label="Minimum deposit term"
            required
            integer
            value={settings.minDepositTerm != null ? String(settings.minDepositTerm) : ''}
            onChange={(value) =>
              onChange({ minDepositTerm: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.minDepositTerm']}
          />
          <SelectField
            id="settings.minDepositTermTypeId"
            label="Minimum deposit term type"
            required
            value={
              settings.minDepositTermTypeId != null
                ? String(settings.minDepositTermTypeId)
                : undefined
            }
            onValueChange={(value) =>
              onChange({ minDepositTermTypeId: value ? Number(value) : undefined })
            }
            options={periodOptions}
            error={errors['settings.minDepositTermTypeId']}
          />
          <NumericField
            id="settings.inMultiplesOfDepositTerm"
            label="In multiples of"
            optional
            integer
            value={
              settings.inMultiplesOfDepositTerm != null
                ? String(settings.inMultiplesOfDepositTerm)
                : ''
            }
            onChange={(value) =>
              onChange({
                inMultiplesOfDepositTerm: value === '' ? undefined : Number(value)
              })
            }
            error={errors['settings.inMultiplesOfDepositTerm']}
          />
          <SelectField
            id="settings.inMultiplesOfDepositTermTypeId"
            label="In multiples of type"
            optional
            value={
              settings.inMultiplesOfDepositTermTypeId != null
                ? String(settings.inMultiplesOfDepositTermTypeId)
                : undefined
            }
            onValueChange={(value) =>
              onChange({
                inMultiplesOfDepositTermTypeId: value ? Number(value) : undefined
              })
            }
            options={periodOptions}
            error={errors['settings.inMultiplesOfDepositTermTypeId']}
          />
          <NumericField
            id="settings.maxDepositTerm"
            label="Maximum deposit term"
            optional
            integer
            value={settings.maxDepositTerm != null ? String(settings.maxDepositTerm) : ''}
            onChange={(value) =>
              onChange({ maxDepositTerm: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.maxDepositTerm']}
          />
          <SelectField
            id="settings.maxDepositTermTypeId"
            label="Maximum deposit term type"
            optional
            value={
              settings.maxDepositTermTypeId != null
                ? String(settings.maxDepositTermTypeId)
                : undefined
            }
            onValueChange={(value) =>
              onChange({ maxDepositTermTypeId: value ? Number(value) : undefined })
            }
            options={periodOptions}
            error={errors['settings.maxDepositTermTypeId']}
          />
        </div>
      </DetailSection>

      <DetailSection title="Pre-closure penalty">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.preClosurePenalApplicable"
            label="Pre-closure penalty applicable"
            checked={settings.preClosurePenalApplicable ?? false}
            onCheckedChange={(preClosurePenalApplicable) => onChange({ preClosurePenalApplicable })}
          />
          {settings.preClosurePenalApplicable ? (
            <>
              <NumericField
                id="settings.preClosurePenalInterest"
                label="Pre-closure penalty interest"
                required
                value={
                  settings.preClosurePenalInterest != null
                    ? String(settings.preClosurePenalInterest)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    preClosurePenalInterest: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.preClosurePenalInterest']}
              />
              <SelectField
                id="settings.preClosurePenalInterestOnTypeId"
                label="Pre-closure penalty on"
                required
                value={
                  settings.preClosurePenalInterestOnTypeId != null
                    ? String(settings.preClosurePenalInterestOnTypeId)
                    : undefined
                }
                onValueChange={(value) =>
                  onChange({
                    preClosurePenalInterestOnTypeId: value ? Number(value) : undefined
                  })
                }
                options={toSelectOptions(template.preClosurePenalInterestOnTypeOptions)}
                error={errors['settings.preClosurePenalInterestOnTypeId']}
              />
            </>
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="Tax">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.withHoldTax"
            label="Withhold tax"
            checked={settings.withHoldTax ?? false}
            onCheckedChange={(withHoldTax) => onChange({ withHoldTax })}
          />
          {settings.withHoldTax ? (
            <SelectField
              id="settings.taxGroupId"
              label="Tax group"
              required
              value={settings.taxGroupId != null ? String(settings.taxGroupId) : undefined}
              onValueChange={(value) =>
                onChange({ taxGroupId: value ? Number(value) : undefined })
              }
              options={toSelectOptions(template.taxGroupOptions)}
              error={errors['settings.taxGroupId']}
            />
          ) : null}
        </div>
      </DetailSection>
    </div>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductKind } from '@mifos/api-client';
import type { LoanProductSettingsInput } from '@mifos/validation';
import { DetailSection } from '@/components/composites';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { NumericField } from '@/components/composites/numeric-field';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  LOAN_PRODUCT_LOAN_SCHEDULE_TYPE_HINT,
  LOAN_PRODUCT_SCHEDULE_PROCESSING_TYPE_HINT
} from '@/lib/fineract/loan-product-field-hints';
import type { LoanProductStepProps } from '../types';
import { LoanProductAttributeOverridesFields } from '../loan-product-attribute-overrides-fields';

function strategyOptions(template: LoanProductStepProps['template']) {
  return (template.transactionProcessingStrategyOptions ?? []).map((option) => ({
    value: option.code ?? String(option.id ?? ''),
    label: option.name ?? option.code ?? 'Strategy'
  }));
}

export function SettingsStep({
  productKind,
  template,
  draft,
  errors,
  onChange
}: LoanProductStepProps & {
  productKind: LoanProductKind;
  onChange: (patch: Partial<LoanProductSettingsInput>) => void;
}) {
  const settings = draft.settings;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Amortization, schedule processing, and optional product features.
      </p>

      <DetailSection title="Repayment settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="settings.amortizationType"
            label="Amortization"
            required
            value={settings.amortizationType != null ? String(settings.amortizationType) : undefined}
            onValueChange={(value) =>
              onChange({ amortizationType: value ? Number(value) : undefined })
            }
            options={toSelectOptions(template.amortizationTypeOptions)}
            error={errors['settings.amortizationType']}
          />
          <SelectField
            id="settings.interestType"
            label="Interest type"
            required
            value={settings.interestType != null ? String(settings.interestType) : undefined}
            onValueChange={(value) =>
              onChange({ interestType: value ? Number(value) : undefined })
            }
            options={toSelectOptions(template.interestTypeOptions)}
            error={errors['settings.interestType']}
          />
          <SwitchField
            id="settings.isEqualAmortization"
            label="Equal amortization"
            checked={settings.isEqualAmortization ?? false}
            onCheckedChange={(isEqualAmortization) => onChange({ isEqualAmortization })}
            error={errors['settings.isEqualAmortization']}
          />
          <SelectField
            id="settings.interestCalculationPeriodType"
            label="Interest calculation period"
            required
            value={
              settings.interestCalculationPeriodType != null
                ? String(settings.interestCalculationPeriodType)
                : undefined
            }
            onValueChange={(value) =>
              onChange({ interestCalculationPeriodType: value ? Number(value) : undefined })
            }
            options={toSelectOptions(template.interestCalculationPeriodTypeOptions)}
            error={errors['settings.interestCalculationPeriodType']}
          />
          <SwitchField
            id="settings.allowPartialPeriodInterestCalculation"
            label="Allow partial period interest calculation"
            checked={settings.allowPartialPeriodInterestCalculation ?? false}
            onCheckedChange={(allowPartialPeriodInterestCalculation) =>
              onChange({ allowPartialPeriodInterestCalculation })
            }
            error={errors['settings.allowPartialPeriodInterestCalculation']}
          />
          <SelectField
            id="settings.transactionProcessingStrategyCode"
            label="Repayment strategy"
            required
            value={settings.transactionProcessingStrategyCode || undefined}
            onValueChange={(value) =>
              onChange({ transactionProcessingStrategyCode: value ?? '' })
            }
            options={strategyOptions(template)}
            error={errors['settings.transactionProcessingStrategyCode']}
          />
          <SelectField
            id="settings.loanScheduleType"
            label="Loan schedule type"
            required
            hint={LOAN_PRODUCT_LOAN_SCHEDULE_TYPE_HINT}
            hintAriaLabel="About loan schedule type"
            value={settings.loanScheduleType != null ? String(settings.loanScheduleType) : undefined}
            onValueChange={(value) =>
              onChange({ loanScheduleType: value ? Number(value) : undefined })
            }
            options={toSelectOptions(template.loanScheduleTypeOptions)}
            error={errors['settings.loanScheduleType']}
          />
          {template.loanScheduleProcessingTypeOptions?.length ? (
            <SelectField
              id="settings.loanScheduleProcessingType"
              label="Schedule processing type"
              optional
              hint={LOAN_PRODUCT_SCHEDULE_PROCESSING_TYPE_HINT}
              hintAriaLabel="About schedule processing type"
              value={
                settings.loanScheduleProcessingType != null
                  ? String(settings.loanScheduleProcessingType)
                  : undefined
              }
              onValueChange={(value) =>
                onChange({ loanScheduleProcessingType: value ? Number(value) : undefined })
              }
              options={toSelectOptions(template.loanScheduleProcessingTypeOptions)}
              error={errors['settings.loanScheduleProcessingType']}
            />
          ) : null}
        </div>
      </DetailSection>

      <DetailSection title="Grace and arrears">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField
            id="settings.graceOnPrincipalPayment"
            label="Grace on principal payment"
            optional
            integer
            value={
              settings.graceOnPrincipalPayment != null
                ? String(settings.graceOnPrincipalPayment)
                : ''
            }
            onChange={(value) =>
              onChange({ graceOnPrincipalPayment: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.graceOnPrincipalPayment']}
          />
          <NumericField
            id="settings.graceOnInterestPayment"
            label="Grace on interest payment"
            optional
            integer
            value={
              settings.graceOnInterestPayment != null
                ? String(settings.graceOnInterestPayment)
                : ''
            }
            onChange={(value) =>
              onChange({ graceOnInterestPayment: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.graceOnInterestPayment']}
          />
          <NumericField
            id="settings.graceOnInterestCharged"
            label="Grace on interest charged"
            optional
            integer
            value={
              settings.graceOnInterestCharged != null
                ? String(settings.graceOnInterestCharged)
                : ''
            }
            onChange={(value) =>
              onChange({ graceOnInterestCharged: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.graceOnInterestCharged']}
          />
          <NumericField
            id="settings.inArrearsTolerance"
            label="Arrears tolerance"
            optional
            value={settings.inArrearsTolerance != null ? String(settings.inArrearsTolerance) : ''}
            onChange={(value) =>
              onChange({ inArrearsTolerance: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.inArrearsTolerance']}
          />
          <NumericField
            id="settings.graceOnArrearsAgeing"
            label="Grace on arrears ageing"
            optional
            integer
            value={
              settings.graceOnArrearsAgeing != null ? String(settings.graceOnArrearsAgeing) : ''
            }
            onChange={(value) =>
              onChange({ graceOnArrearsAgeing: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.graceOnArrearsAgeing']}
          />
          <NumericField
            id="settings.overdueDaysForNPA"
            label="Overdue days for NPA"
            optional
            integer
            value={settings.overdueDaysForNPA != null ? String(settings.overdueDaysForNPA) : ''}
            onChange={(value) =>
              onChange({ overdueDaysForNPA: value === '' ? undefined : Number(value) })
            }
            error={errors['settings.overdueDaysForNPA']}
          />
          <SwitchField
            id="settings.accountMovesOutOfNPAOnlyOnArrearsCompletion"
            label="Account moves out of NPA only on arrears completion"
            checked={settings.accountMovesOutOfNPAOnlyOnArrearsCompletion ?? false}
            onCheckedChange={(accountMovesOutOfNPAOnlyOnArrearsCompletion) =>
              onChange({ accountMovesOutOfNPAOnlyOnArrearsCompletion })
            }
            error={errors['settings.accountMovesOutOfNPAOnlyOnArrearsCompletion']}
          />
        </div>
      </DetailSection>

      <DetailSection title="Calendar">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="settings.daysInMonthType"
            label="Days in month"
            required
            value={settings.daysInMonthType != null ? String(settings.daysInMonthType) : undefined}
            onValueChange={(value) =>
              onChange({ daysInMonthType: value ? Number(value) : undefined })
            }
            options={toSelectOptions(template.daysInMonthTypeOptions)}
            error={errors['settings.daysInMonthType']}
          />
          <SelectField
            id="settings.daysInYearType"
            label="Days in year"
            required
            value={settings.daysInYearType != null ? String(settings.daysInYearType) : undefined}
            onValueChange={(value) =>
              onChange({ daysInYearType: value ? Number(value) : undefined })
            }
            options={toSelectOptions(template.daysInYearTypeOptions)}
            error={errors['settings.daysInYearType']}
          />
        </div>
      </DetailSection>

      <DetailSection title="Optional features">
        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchField
            id="settings.multiDisburseLoan"
            label="Multi-disburse loan"
            checked={settings.multiDisburseLoan ?? false}
            onCheckedChange={(multiDisburseLoan) => onChange({ multiDisburseLoan })}
            error={errors['settings.multiDisburseLoan']}
          />
          {settings.multiDisburseLoan ? (
            <>
              <NumericField
                id="settings.maxTrancheCount"
                label="Maximum tranche count"
                optional
                integer
                value={settings.maxTrancheCount != null ? String(settings.maxTrancheCount) : ''}
                onChange={(value) =>
                  onChange({ maxTrancheCount: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.maxTrancheCount']}
              />
              <SwitchField
                id="settings.allowFullTermForTranche"
                label="Allow full term for tranche"
                checked={settings.allowFullTermForTranche ?? false}
                onCheckedChange={(allowFullTermForTranche) =>
                  onChange({ allowFullTermForTranche })
                }
                error={errors['settings.allowFullTermForTranche']}
              />
            </>
          ) : null}

          <SwitchField
            id="settings.holdGuaranteeFunds"
            label="Hold guarantee funds"
            checked={settings.holdGuaranteeFunds ?? false}
            onCheckedChange={(holdGuaranteeFunds) => onChange({ holdGuaranteeFunds })}
            error={errors['settings.holdGuaranteeFunds']}
          />
          {settings.holdGuaranteeFunds ? (
            <>
              <NumericField
                id="settings.mandatoryGuarantee"
                label="Mandatory guarantee (%)"
                optional
                value={
                  settings.mandatoryGuarantee != null ? String(settings.mandatoryGuarantee) : ''
                }
                onChange={(value) =>
                  onChange({ mandatoryGuarantee: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.mandatoryGuarantee']}
              />
              <NumericField
                id="settings.minimumGuaranteeFromOwnFunds"
                label="Minimum guarantee from own funds (%)"
                optional
                value={
                  settings.minimumGuaranteeFromOwnFunds != null
                    ? String(settings.minimumGuaranteeFromOwnFunds)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    minimumGuaranteeFromOwnFunds: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.minimumGuaranteeFromOwnFunds']}
              />
              <NumericField
                id="settings.minimumGuaranteeFromGuarantor"
                label="Minimum guarantee from guarantor (%)"
                optional
                value={
                  settings.minimumGuaranteeFromGuarantor != null
                    ? String(settings.minimumGuaranteeFromGuarantor)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    minimumGuaranteeFromGuarantor: value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.minimumGuaranteeFromGuarantor']}
              />
            </>
          ) : null}

          <SwitchField
            id="settings.enableDownPayment"
            label="Enable down payment"
            checked={settings.enableDownPayment ?? false}
            onCheckedChange={(enableDownPayment) => onChange({ enableDownPayment })}
            error={errors['settings.enableDownPayment']}
          />
          {settings.enableDownPayment ? (
            <>
              <NumericField
                id="settings.disbursedAmountPercentageForDownPayment"
                label="Disbursed amount percentage for down payment"
                required
                value={
                  settings.disbursedAmountPercentageForDownPayment != null
                    ? String(settings.disbursedAmountPercentageForDownPayment)
                    : ''
                }
                onChange={(value) =>
                  onChange({
                    disbursedAmountPercentageForDownPayment:
                      value === '' ? undefined : Number(value)
                  })
                }
                error={errors['settings.disbursedAmountPercentageForDownPayment']}
              />
              <SwitchField
                id="settings.enableAutoRepaymentForDownPayment"
                label="Enable auto repayment for down payment"
                checked={settings.enableAutoRepaymentForDownPayment ?? false}
                onCheckedChange={(enableAutoRepaymentForDownPayment) =>
                  onChange({ enableAutoRepaymentForDownPayment })
                }
                error={errors['settings.enableAutoRepaymentForDownPayment']}
              />
            </>
          ) : null}

          <SwitchField
            id="settings.allowVariableInstallments"
            label="Allow variable installments"
            checked={settings.allowVariableInstallments ?? false}
            onCheckedChange={(allowVariableInstallments) =>
              onChange({ allowVariableInstallments })
            }
            error={errors['settings.allowVariableInstallments']}
          />
          {settings.allowVariableInstallments ? (
            <>
              <NumericField
                id="settings.minimumGap"
                label="Minimum gap (days)"
                optional
                integer
                value={settings.minimumGap != null ? String(settings.minimumGap) : ''}
                onChange={(value) =>
                  onChange({ minimumGap: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.minimumGap']}
              />
              <NumericField
                id="settings.maximumGap"
                label="Maximum gap (days)"
                optional
                integer
                value={settings.maximumGap != null ? String(settings.maximumGap) : ''}
                onChange={(value) =>
                  onChange({ maximumGap: value === '' ? undefined : Number(value) })
                }
                error={errors['settings.maximumGap']}
              />
            </>
          ) : null}

          <SwitchField
            id="settings.canDefineInstallmentAmount"
            label="Can define installment amount"
            checked={settings.canDefineInstallmentAmount ?? false}
            onCheckedChange={(canDefineInstallmentAmount) =>
              onChange({ canDefineInstallmentAmount })
            }
            error={errors['settings.canDefineInstallmentAmount']}
          />
          <SwitchField
            id="settings.disallowExpectedDisbursements"
            label="Disallow expected disbursements"
            checked={settings.disallowExpectedDisbursements ?? false}
            onCheckedChange={(disallowExpectedDisbursements) =>
              onChange({ disallowExpectedDisbursements })
            }
            error={errors['settings.disallowExpectedDisbursements']}
          />
          <SwitchField
            id="settings.canUseForTopup"
            label="Can use for top-up"
            checked={settings.canUseForTopup ?? false}
            onCheckedChange={(canUseForTopup) => onChange({ canUseForTopup })}
            error={errors['settings.canUseForTopup']}
          />
          <SwitchField
            id="settings.isInterestRecalculationEnabled"
            label="Interest recalculation enabled"
            checked={settings.isInterestRecalculationEnabled ?? false}
            onCheckedChange={(isInterestRecalculationEnabled) =>
              onChange({ isInterestRecalculationEnabled })
            }
            error={errors['settings.isInterestRecalculationEnabled']}
          />
          <SwitchField
            id="settings.enableInstallmentLevelDelinquency"
            label="Installment-level delinquency"
            checked={settings.enableInstallmentLevelDelinquency ?? false}
            onCheckedChange={(enableInstallmentLevelDelinquency) =>
              onChange({ enableInstallmentLevelDelinquency })
            }
            error={errors['settings.enableInstallmentLevelDelinquency']}
          />
          {settings.enableInstallmentLevelDelinquency ? (
            <SelectField
              id="settings.delinquencyBucketId"
              label="Delinquency bucket"
              optional
              value={
                settings.delinquencyBucketId ? String(settings.delinquencyBucketId) : undefined
              }
              onValueChange={(value) =>
                onChange({ delinquencyBucketId: value ? Number(value) : undefined })
              }
              options={toSelectOptions(template.delinquencyBucketOptions)}
              error={errors['settings.delinquencyBucketId']}
            />
          ) : null}
          <SwitchField
            id="settings.allowAccrualPostingInArrears"
            label="Allow accrual posting in arrears"
            checked={settings.allowAccrualPostingInArrears ?? false}
            onCheckedChange={(allowAccrualPostingInArrears) =>
              onChange({ allowAccrualPostingInArrears })
            }
            error={errors['settings.allowAccrualPostingInArrears']}
          />
          <SwitchField
            id="settings.syncExpectedWithDisbursementDate"
            label="Sync expected with disbursement date"
            checked={settings.syncExpectedWithDisbursementDate ?? false}
            onCheckedChange={(syncExpectedWithDisbursementDate) =>
              onChange({ syncExpectedWithDisbursementDate })
            }
            error={errors['settings.syncExpectedWithDisbursementDate']}
          />
        </div>
      </DetailSection>

      <LoanProductAttributeOverridesFields
        productKind={productKind}
        enabled={settings.allowAttributeConfiguration ?? false}
        overrides={settings.allowAttributeOverrides ?? {}}
        errors={errors}
        onEnabledChange={(allowAttributeConfiguration) => onChange({ allowAttributeConfiguration })}
        onOverridesChange={(allowAttributeOverrides) => onChange({ allowAttributeOverrides })}
      />
    </div>
  );
}

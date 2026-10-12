'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  MoneyValue
} from '@/components/composites';
import { enumOptionLabel, formatYesNo } from '@/lib/fineract/client-detail-labels';
import {
  productChargeLabelById,
  productChargePreviewLabelById
} from '@/lib/fineract/charge-display';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import { loanProductAttributeOverrideFields } from '@/lib/fineract/loan-product-attribute-overrides';
import { fineractOptionLabel } from '@/lib/form/select-options';
import type { LoanProductKind } from '@mifos/api-client';
import type { LoanProductStepProps, WizardMode } from '../types';
import { LOAN_ACCOUNT_FIELDS } from './accounting-step';

function numericAccountId(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function liveLabel(label: string, mode: WizardMode, live: boolean): string {
  if (mode !== 'edit' || !live) {
    return label;
  }
  return `${label} (Changes existing loans)`;
}

function optionLabelById(
  options: { id: number; name?: string; value?: string }[] | undefined,
  id?: number
): string {
  if (id == null) {
    return '—';
  }
  const match = options?.find((option) => option.id === id);
  return match ? fineractOptionLabel(match) : String(id);
}

function glLabelFromOptions(
  options: { id?: number; name?: string; glCode?: string }[] | undefined,
  id?: number
): string {
  if (id == null) {
    return '—';
  }
  const match = options?.find((option) => option.id === id);
  return match ? glAccountLabel(match) : String(id);
}

function strategyLabel(
  template: LoanProductStepProps['template'],
  code?: string
): string {
  if (!code) {
    return '—';
  }
  const match = template.transactionProcessingStrategyOptions?.find(
    (option) => option.code === code
  );
  return match?.name ?? code;
}

export function PreviewStep({
  productKind,
  template,
  draft,
  mode,
  hasUnsavedChanges = true
}: LoanProductStepProps & {
  productKind: LoanProductKind;
  mode: WizardMode;
  hasUnsavedChanges?: boolean;
}) {
  const { details, currency, settings, terms, charges, accounting } = draft;
  const currencyCode = currency.currencyCode || undefined;
  const accountingOptions = template.accountingMappingOptions ?? {};
  const allGlOptions = [
    ...(accountingOptions.assetAccountOptions ?? []),
    ...(accountingOptions.incomeAccountOptions ?? []),
    ...(accountingOptions.expenseAccountOptions ?? []),
    ...(accountingOptions.liabilityAccountOptions ?? [])
  ];

  const chargeAmounts = charges.chargeAmounts ?? {};
  const selectedCharges = (charges.chargeIds ?? [])
    .map((id) => {
      const fee = template.chargeOptions?.find((option) => option.id === id);
      if (fee) {
        return `${productChargePreviewLabelById(template.chargeOptions, id, chargeAmounts, currencyCode)} (fee)`;
      }
      const penalty = template.penaltyOptions?.find((option) => option.id === id);
      if (penalty) {
        return `${productChargePreviewLabelById(template.penaltyOptions, id, chargeAmounts, currencyCode)} (penalty)`;
      }
      return `Charge #${id}`;
    })
    .join(', ');

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the product configuration before {mode === 'create' ? 'creating' : 'saving'}.
      </p>

      {mode === 'edit' && !hasUnsavedChanges ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          No changes to save. Update a field to enable save.
        </p>
      ) : null}

      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Name">{details.name}</DetailField>
          <DetailField label="Short name">{details.shortName}</DetailField>
          <DetailField label="Fund">
            {optionLabelById(template.fundOptions, details.fundId)}
          </DetailField>
          <DetailField label="External ID">{details.externalId || '—'}</DetailField>
          <DetailField label="Start date">{details.startDate || '—'}</DetailField>
          <DetailField label="Expiry date">{details.closeDate || '—'}</DetailField>
          <DetailField label="Include in customer loan counter">
            {formatYesNo(details.includeInBorrowerCycle)}
          </DetailField>
          {details.description ? (
            <DetailField label="Description" className="sm:col-span-2">
              {details.description}
            </DetailField>
          ) : null}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Currency">
        <DetailFieldGrid>
          <DetailField label="Currency code">{currency.currencyCode || '—'}</DetailField>
          <DetailField label="Decimal places">{currency.digitsAfterDecimal ?? '—'}</DetailField>
          <DetailField label="In multiples of">{currency.inMultiplesOf ?? '—'}</DetailField>
          <DetailField label="Installment amount in multiples of">
            {currency.installmentAmountInMultiplesOf ?? '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Settings">
        <DetailFieldGrid>
          <DetailField label="Amortization">
            {enumOptionLabel(
              template.amortizationTypeOptions?.find((o) => o.id === settings.amortizationType)
            ) ?? '—'}
          </DetailField>
          <DetailField label="Interest type">
            {enumOptionLabel(
              template.interestTypeOptions?.find((o) => o.id === settings.interestType)
            ) ?? '—'}
          </DetailField>
          <DetailField label="Repayment strategy">
            {strategyLabel(template, settings.transactionProcessingStrategyCode)}
          </DetailField>
          <DetailField label="Loan schedule type">
            {enumOptionLabel(
              template.loanScheduleTypeOptions?.find((o) => o.id === settings.loanScheduleType)
            ) ?? '—'}
          </DetailField>
          {template.loanScheduleProcessingTypeOptions?.length ? (
            <DetailField label="Schedule processing type">
              {enumOptionLabel(
                template.loanScheduleProcessingTypeOptions?.find(
                  (o) => o.id === settings.loanScheduleProcessingType
                )
              ) ?? '—'}
            </DetailField>
          ) : null}
          <DetailField label={liveLabel('Multi-disburse', mode, true)}>
            {formatYesNo(settings.multiDisburseLoan)}
          </DetailField>
          {settings.multiDisburseLoan ? (
            <DetailField label={liveLabel('Maximum tranche count', mode, true)}>
              {settings.maxTrancheCount ?? '—'}
            </DetailField>
          ) : null}
          <DetailField label={liveLabel('Hold guarantee funds', mode, true)}>
            {formatYesNo(settings.holdGuaranteeFunds)}
          </DetailField>
          {settings.holdGuaranteeFunds ? (
            <>
              <DetailField label={liveLabel('Mandatory guarantee (%)', mode, true)}>
                {settings.mandatoryGuarantee ?? '—'}
              </DetailField>
              <DetailField label={liveLabel('Minimum guarantee from own funds (%)', mode, true)}>
                {settings.minimumGuaranteeFromOwnFunds ?? '—'}
              </DetailField>
              <DetailField label={liveLabel('Minimum guarantee from guarantor (%)', mode, true)}>
                {settings.minimumGuaranteeFromGuarantor ?? '—'}
              </DetailField>
            </>
          ) : null}
          <DetailField label="Down payment">{formatYesNo(settings.enableDownPayment)}</DetailField>
          {settings.enableDownPayment ? (
            <>
              <DetailField label="Down payment percentage">
                {settings.disbursedAmountPercentageForDownPayment ?? '—'}
              </DetailField>
              <DetailField label="Auto repayment for down payment">
                {formatYesNo(settings.enableAutoRepaymentForDownPayment)}
              </DetailField>
            </>
          ) : null}
          <DetailField label="Variable installments">
            {formatYesNo(settings.allowVariableInstallments)}
          </DetailField>
          {settings.allowVariableInstallments ? (
            <>
              <DetailField label="Minimum gap">{settings.minimumGap ?? '—'}</DetailField>
              <DetailField label="Maximum gap">{settings.maximumGap ?? '—'}</DetailField>
            </>
          ) : null}
          {settings.canUseForTopup ? (
            <DetailField label="Can be used for top-up">{formatYesNo(true)}</DetailField>
          ) : null}
          <DetailField label={liveLabel('Disallow expected disbursements', mode, true)}>
            {formatYesNo(settings.disallowExpectedDisbursements)}
          </DetailField>
          <DetailField
            label={liveLabel('Allow approved or disbursed amounts over applied', mode, true)}
          >
            {formatYesNo(settings.allowApprovedDisbursedAmountsOverApplied)}
          </DetailField>
          {settings.allowApprovedDisbursedAmountsOverApplied ? (
            <>
              <DetailField label={liveLabel('Over-applied calculation type', mode, true)}>
                {settings.overAppliedCalculationType ?? '—'}
              </DetailField>
              <DetailField label={liveLabel('Over-applied number', mode, true)}>
                {settings.overAppliedNumber ?? '—'}
              </DetailField>
            </>
          ) : null}
          <DetailField label={liveLabel('Sync expected with disbursement date', mode, true)}>
            {formatYesNo(settings.syncExpectedWithDisbursementDate)}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Interest calendar">
        <DetailFieldGrid>
          <DetailField label="Interest calculation period">
            {enumOptionLabel(
              template.interestCalculationPeriodTypeOptions?.find(
                (option) => option.id === settings.interestCalculationPeriodType
              )
            ) ?? '—'}
          </DetailField>
          <DetailField label="Partial-period interest">
            {formatYesNo(settings.allowPartialPeriodInterestCalculation)}
          </DetailField>
          <DetailField label="Days in year">
            {enumOptionLabel(
              template.daysInYearTypeOptions?.find((option) => option.id === settings.daysInYearType)
            ) ?? '—'}
          </DetailField>
          <DetailField label="Days in month">
            {enumOptionLabel(
              template.daysInMonthTypeOptions?.find((option) => option.id === settings.daysInMonthType)
            ) ?? '—'}
          </DetailField>
          <DetailField label="Repayment start date type">
            {enumOptionLabel(
              template.repaymentStartDateTypeOptions?.find(
                (option) => option.id === terms.repaymentStartDateType
              )
            ) ?? '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Grace and arrears">
        <DetailFieldGrid>
          <DetailField label="Grace on principal">{settings.graceOnPrincipalPayment ?? '—'}</DetailField>
          <DetailField label="Grace on interest payment">
            {settings.graceOnInterestPayment ?? '—'}
          </DetailField>
          <DetailField label="Grace on interest charged">
            {settings.graceOnInterestCharged ?? '—'}
          </DetailField>
          <DetailField label="Arrears tolerance">{settings.inArrearsTolerance ?? '—'}</DetailField>
          <DetailField label="Grace on arrears ageing">
            {settings.graceOnArrearsAgeing ?? '—'}
          </DetailField>
          <DetailField label={liveLabel('Overdue days for NPA', mode, true)}>
            {settings.overdueDaysForNPA ?? '—'}
          </DetailField>
          <DetailField
            label={liveLabel('Account moves out of NPA only on arrears completion', mode, true)}
          >
            {formatYesNo(settings.accountMovesOutOfNPAOnlyOnArrearsCompletion)}
          </DetailField>
          <DetailField label="Installment-level delinquency">
            {formatYesNo(settings.enableInstallmentLevelDelinquency)}
          </DetailField>
          <DetailField label={liveLabel('Delinquency bucket', mode, true)}>
            {optionLabelById(template.delinquencyBucketOptions, settings.delinquencyBucketId)}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Configurable terms and settings">
        <DetailFieldGrid>
          <DetailField label="Allow overrides in loan accounts">
            {formatYesNo(settings.allowAttributeConfiguration)}
          </DetailField>
          {settings.allowAttributeConfiguration
            ? loanProductAttributeOverrideFields(productKind).map((field) => (
                <DetailField key={field.key} label={field.label}>
                  {formatYesNo(settings.allowAttributeOverrides?.[field.key])}
                </DetailField>
              ))
            : null}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Terms">
        <DetailFieldGrid>
          <DetailField label="Default principal">
            <MoneyValue amount={terms.principal} currencyCode={currencyCode ?? ''} />
          </DetailField>
          <DetailField label="Number of repayments">{terms.numberOfRepayments ?? '—'}</DetailField>
          <DetailField label="Repay every">
            {terms.repaymentEvery != null
              ? `${terms.repaymentEvery} ${enumOptionLabel(
                  template.repaymentFrequencyTypeOptions?.find(
                    (o) => o.id === terms.repaymentFrequencyType
                  )
                ) ?? ''}`.trim()
              : '—'}
          </DetailField>
          {terms.isLinkedToFloatingInterestRates ? (
            <>
              <DetailField label="Floating rate">
                {optionLabelById(template.floatingRateOptions, terms.floatingRatesId)}
              </DetailField>
              <DetailField label="Interest rate differential (%)">
                {terms.interestRateDifferential ?? '—'}
              </DetailField>
              <DetailField label="Min differential rate">
                {terms.minDifferentialLendingRate ?? '—'}
              </DetailField>
              <DetailField label="Default differential lending rate">
                {terms.defaultDifferentialLendingRate ?? '—'}
              </DetailField>
              <DetailField label="Max differential rate">
                {terms.maxDifferentialLendingRate ?? '—'}
              </DetailField>
            </>
          ) : (
            <>
              <DetailField label="Minimum interest rate">
                {terms.minInterestRatePerPeriod != null
                  ? `${terms.minInterestRatePerPeriod}%`
                  : '—'}
              </DetailField>
              <DetailField label="Default interest rate">
                {terms.interestRatePerPeriod != null ? `${terms.interestRatePerPeriod}%` : '—'}
              </DetailField>
              <DetailField label="Maximum interest rate">
                {terms.maxInterestRatePerPeriod != null
                  ? `${terms.maxInterestRatePerPeriod}%`
                  : '—'}
              </DetailField>
              <DetailField label="Interest rate frequency">
                {enumOptionLabel(
                  template.interestRateFrequencyTypeOptions?.find(
                    (o) => o.id === terms.interestRateFrequencyType
                  )
                ) ?? '—'}
              </DetailField>
            </>
          )}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Charges">
        <DetailFieldGrid columns={1}>
          <DetailField label="Selected fees and penalties">
            {selectedCharges || 'None'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Accounting">
        <DetailFieldGrid>
          <DetailField label={liveLabel('Accounting rule', mode, true)}>
            {accountingRuleLabel(
              template.accountingRuleOptions?.find((o) => o.id === accounting.accountingRule)
            )}
          </DetailField>
          {accounting.accountingRule !== 1
            ? LOAN_ACCOUNT_FIELDS.map((field) => (
                <DetailField key={field.key} label={field.label}>
                  {glLabelFromOptions(
                    accountingOptions[field.optionKey],
                    numericAccountId(accounting[field.key])
                  )}
                </DetailField>
              ))
            : null}
        </DetailFieldGrid>
      </DetailSection>

      {accounting.accountingRule !== 1 ? (
        <DetailSection title="Mappings">
          <DetailFieldGrid columns={1}>
            <DetailField label="Payment channels">
              {(accounting.paymentChannelToFundSourceMappings ?? []).length > 0
                ? (accounting.paymentChannelToFundSourceMappings ?? [])
                    .map(
                      (row) =>
                        `${optionLabelById(template.paymentTypeOptions, row.paymentTypeId)} → ${glLabelFromOptions(allGlOptions, row.fundSourceAccountId)}`
                    )
                    .join('; ')
                : 'None'}
            </DetailField>
            <DetailField label="Fees">
              {(accounting.feeToIncomeAccountMappings ?? []).length > 0
                ? (accounting.feeToIncomeAccountMappings ?? [])
                    .map(
                      (row) =>
                        `${productChargeLabelById(template.chargeOptions, row.chargeId, currencyCode)} → ${glLabelFromOptions(accountingOptions.incomeAccountOptions, row.incomeAccountId)}`
                    )
                    .join('; ')
                : 'None'}
            </DetailField>
            <DetailField label="Penalties">
              {(accounting.penaltyToIncomeAccountMappings ?? []).length > 0
                ? (accounting.penaltyToIncomeAccountMappings ?? [])
                    .map(
                      (row) =>
                        `${productChargeLabelById(template.penaltyOptions, row.chargeId, currencyCode)} → ${glLabelFromOptions(accountingOptions.incomeAccountOptions, row.incomeAccountId)}`
                    )
                    .join('; ')
                : 'None'}
            </DetailField>
          </DetailFieldGrid>
        </DetailSection>
      ) : null}
    </div>
  );
}

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
  formatProductChargeOptionLabel,
  productChargeLabelById
} from '@/lib/fineract/charge-display';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import { loanProductAttributeOverrideFields } from '@/lib/fineract/loan-product-attribute-overrides';
import { fineractOptionLabel } from '@/lib/form/select-options';
import type { LoanProductKind } from '@mifos/api-client';
import type { LoanProductStepProps, WizardMode } from '../types';

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
  submitError,
  mode,
  hasUnsavedChanges = true
}: LoanProductStepProps & {
  productKind: LoanProductKind;
  submitError: string | null;
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

  const selectedCharges = (charges.chargeIds ?? [])
    .map((id) => {
      const fee = template.chargeOptions?.find((option) => option.id === id);
      if (fee) {
        return `${formatProductChargeOptionLabel(fee, currencyCode)} (fee)`;
      }
      const penalty = template.penaltyOptions?.find((option) => option.id === id);
      if (penalty) {
        return `${formatProductChargeOptionLabel(penalty, currencyCode)} (penalty)`;
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

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
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
          <DetailField label="Multi-disburse">{formatYesNo(settings.multiDisburseLoan)}</DetailField>
          <DetailField label="Hold guarantee funds">
            {formatYesNo(settings.holdGuaranteeFunds)}
          </DetailField>
          <DetailField label="Down payment">{formatYesNo(settings.enableDownPayment)}</DetailField>
          <DetailField label="Variable installments">
            {formatYesNo(settings.allowVariableInstallments)}
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
            <DetailField label="Floating rate">
              {optionLabelById(template.floatingRateOptions, terms.floatingRatesId)}
            </DetailField>
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
          <DetailField label="Accounting rule">
            {accountingRuleLabel(
              template.accountingRuleOptions?.find((o) => o.id === accounting.accountingRule)
            )}
          </DetailField>
          {accounting.accountingRule !== 1 ? (
            <>
              <DetailField label="Fund source">
                {glLabelFromOptions(allGlOptions, accounting.fundSourceAccountId)}
              </DetailField>
              <DetailField label="Loan portfolio">
                {glLabelFromOptions(allGlOptions, accounting.loanPortfolioAccountId)}
              </DetailField>
              <DetailField label="Income from interest">
                {glLabelFromOptions(allGlOptions, accounting.interestOnLoanAccountId)}
              </DetailField>
            </>
          ) : null}
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

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
import { formatYesNo } from '@/lib/fineract/client-detail-labels';
import { fineractOptionLabel } from '@/lib/form/select-options';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import { productChargeLabelById } from '@/lib/fineract/charge-display';
import type { DepositProductStepProps, WizardMode } from '../types';

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

export function PreviewStep({
  config,
  template,
  draft,
  submitError,
  mode,
  hasUnsavedChanges = true
}: DepositProductStepProps & {
  submitError: string | null;
  mode: WizardMode;
  hasUnsavedChanges?: boolean;
}) {
  const { details, currency, terms, settings, interestRateChart, charges, accounting } = draft;
  const currencyCode = currency.currencyCode || 'USD';
  const accountingOptions = template.accountingMappingOptions ?? {};
  const allGlOptions = [
    ...(accountingOptions.assetAccountOptions ?? []),
    ...(accountingOptions.incomeAccountOptions ?? []),
    ...(accountingOptions.expenseAccountOptions ?? []),
    ...(accountingOptions.liabilityAccountOptions ?? [])
  ];
  const periodOptions = template.periodFrequencyTypeOptions?.slice(0, -1);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the configuration before{' '}
        {mode === 'create' ? `creating this ${config.label.toLowerCase()}` : 'saving'}.
      </p>

      {mode === 'edit' && !hasUnsavedChanges ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          No changes to save. Update a field to enable save.
        </p>
      ) : null}

      {submitError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Name">{details.name}</DetailField>
          <DetailField label="Short name">{details.shortName}</DetailField>
          <DetailField label="Start date">{details.startDate || '—'}</DetailField>
          <DetailField label="Expiry date">{details.closeDate || '—'}</DetailField>
          <DetailField label="Description">{details.description || '—'}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Currency">
        <DetailFieldGrid>
          <DetailField label="Currency">{currency.currencyCode}</DetailField>
          <DetailField label="Decimal places">{String(currency.digitsAfterDecimal ?? '—')}</DetailField>
          <DetailField label="In multiples of">
            {currency.inMultiplesOf != null && currency.inMultiplesOf > 0
              ? String(currency.inMultiplesOf)
              : '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Terms">
        <DetailFieldGrid>
          <DetailField label="Default deposit amount">
            <MoneyValue amount={terms.depositAmount} currencyCode={currencyCode} />
          </DetailField>
          <DetailField label="Interest compounding">
            {optionLabelById(
              template.interestCompoundingPeriodTypeOptions,
              terms.interestCompoundingPeriodType
            )}
          </DetailField>
          <DetailField label="Interest posting">
            {optionLabelById(
              template.interestPostingPeriodTypeOptions,
              terms.interestPostingPeriodType
            )}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Settings">
        <DetailFieldGrid>
          {config.isRecurring ? (
            <>
              <DetailField label="Mandatory deposit">
                {formatYesNo(settings.isMandatoryDeposit)}
              </DetailField>
              <DetailField label="Allow withdrawal">
                {formatYesNo(settings.allowWithdrawal)}
              </DetailField>
            </>
          ) : null}
          <DetailField label="Minimum deposit term">{String(settings.minDepositTerm ?? '—')}</DetailField>
          <DetailField label="Minimum deposit term type">
            {optionLabelById(periodOptions, settings.minDepositTermTypeId)}
          </DetailField>
          <DetailField label="Withhold tax">{formatYesNo(settings.withHoldTax)}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Interest rate chart">
        <p className="text-sm text-muted-foreground">
          {interestRateChart.charts.length} chart
          {interestRateChart.charts.length === 1 ? '' : 's'},{' '}
          {interestRateChart.charts.reduce((sum, chart) => sum + chart.chartSlabs.length, 0)} slab
          {interestRateChart.charts.reduce((sum, chart) => sum + chart.chartSlabs.length, 0) === 1
            ? ''
            : 's'}
        </p>
      </DetailSection>

      <DetailSection title="Charges">
        <DetailFieldGrid>
          <DetailField label="Fees">
            {charges.chargeIds.length
              ? charges.chargeIds
                  .filter((id) => template.chargeOptions?.some((option) => option.id === id))
                  .map((id) => productChargeLabelById(template.chargeOptions, id, currencyCode))
                  .join(', ') || 'None'
              : 'None'}
          </DetailField>
          <DetailField label="Penalties">
            {charges.chargeIds.length
              ? charges.chargeIds
                  .filter((id) => template.penaltyOptions?.some((option) => option.id === id))
                  .map((id) => productChargeLabelById(template.penaltyOptions, id, currencyCode))
                  .join(', ') || 'None'
              : 'None'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Accounting">
        <DetailFieldGrid>
          <DetailField label="Accounting rule">
            {accountingRuleLabel(
              template.accountingRuleOptions?.find((option) => option.id === accounting.accountingRule)
            )}
          </DetailField>
          {accounting.accountingRule !== 1 ? (
            <>
              <DetailField label="Saving reference">
                {glLabelFromOptions(allGlOptions, accounting.savingsReferenceAccountId)}
              </DetailField>
              <DetailField label="Income from fees">
                {glLabelFromOptions(allGlOptions, accounting.incomeFromFeeAccountId)}
              </DetailField>
            </>
          ) : null}
        </DetailFieldGrid>
      </DetailSection>
    </div>
  );
}

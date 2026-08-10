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
import { fineractOptionLabel } from '@/lib/form/select-options';
import {
  productChargeLabelById,
  productChargePreviewLabelById
} from '@/lib/fineract/charge-display';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import type { SavingsProductStepProps, WizardMode } from '../types';

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
  template,
  draft,
  submitError,
  mode,
  hasUnsavedChanges = true
}: SavingsProductStepProps & {
  submitError: string | null;
  mode: WizardMode;
  hasUnsavedChanges?: boolean;
}) {
  const { details, currency, terms, settings, charges, accounting } = draft;
  const currencyCode = currency.currencyCode || undefined;
  const accountingOptions = template.accountingMappingOptions ?? {};
  const allGlOptions = [
    ...(accountingOptions.assetAccountOptions ?? []),
    ...(accountingOptions.incomeAccountOptions ?? []),
    ...(accountingOptions.expenseAccountOptions ?? []),
    ...(accountingOptions.liabilityAccountOptions ?? [])
  ];

  const selectedCharges = (charges.chargeIds ?? [])
    .map((id) =>
      productChargePreviewLabelById(
        template.chargeOptions,
        id,
        charges.chargeAmounts,
        currencyCode
      )
    )
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
          <DetailField label="Start date">{details.startDate || '—'}</DetailField>
          <DetailField label="Expiry date">{details.closeDate || '—'}</DetailField>
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

      <DetailSection title="Terms">
        <DetailFieldGrid>
          <DetailField label="Nominal annual interest">
            {terms.nominalAnnualInterestRate != null
              ? `${terms.nominalAnnualInterestRate}%`
              : '—'}
          </DetailField>
          <DetailField label="Compounding period">
            {enumOptionLabel(
              template.interestCompoundingPeriodTypeOptions?.find(
                (o) => o.id === terms.interestCompoundingPeriodType
              )
            ) ?? '—'}
          </DetailField>
          <DetailField label="Posting period">
            {enumOptionLabel(
              template.interestPostingPeriodTypeOptions?.find(
                (o) => o.id === terms.interestPostingPeriodType
              )
            ) ?? '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Settings">
        <DetailFieldGrid>
          <DetailField label="Allow overdraft">{formatYesNo(settings.allowOverdraft)}</DetailField>
          <DetailField label="Withhold tax">{formatYesNo(settings.withHoldTax)}</DetailField>
          <DetailField label="Dormancy tracking">
            {formatYesNo(settings.isDormancyTrackingActive)}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Charges">
        <DetailFieldGrid columns={1}>
          <DetailField label="Selected fees">{selectedCharges || 'None'}</DetailField>
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
              <DetailField label="Saving reference">
                {glLabelFromOptions(allGlOptions, accounting.savingsReferenceAccountId)}
              </DetailField>
              <DetailField label="Income from interest">
                {glLabelFromOptions(allGlOptions, accounting.incomeFromInterestId)}
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

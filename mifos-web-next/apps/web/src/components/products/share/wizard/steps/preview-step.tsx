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
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { productChargeLabelById } from '@/lib/fineract/charge-display';
import { accountingRuleLabel, glAccountLabel } from '@/lib/fineract/product-display';
import { fineractOptionLabel } from '@/lib/form/select-options';
import type { ShareProductStepProps } from '../types';

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
  submitError
}: ShareProductStepProps & {
  submitError: string | null;
}) {
  const { details, currency, terms, settings, marketPrice, charges, accounting } = draft;
  const currencyCode = currency.currencyCode || 'USD';
  const mappingOptions = template.accountingMappingOptions ?? {};
  const allGlOptions = [
    ...(mappingOptions.assetAccountOptions ?? []),
    ...(mappingOptions.incomeAccountOptions ?? []),
    ...(mappingOptions.equityAccountOptions ?? []),
    ...(mappingOptions.liabilityAccountOptions ?? [])
  ];

  const selectedCharges = (charges.chargeIds ?? [])
    .map((id) => productChargeLabelById(template.chargeOptions, id, currencyCode))
    .join(', ');

  const shareCapital =
    terms.shareCapital ?? (terms.sharesIssued ?? 0) * (terms.unitPrice ?? 0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the product configuration before saving.
      </p>

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <DetailSection title="Details">
        <DetailFieldGrid>
          <DetailField label="Name">{details.name}</DetailField>
          <DetailField label="Short name">{details.shortName}</DetailField>
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
          <DetailField label="Total shares">{terms.totalShares ?? '—'}</DetailField>
          <DetailField label="Shares issued">{terms.sharesIssued ?? '—'}</DetailField>
          <DetailField label="Unit price">
            <MoneyValue amount={terms.unitPrice} currencyCode={currencyCode} />
          </DetailField>
          <DetailField label="Share capital">
            <MoneyValue amount={shareCapital} currencyCode={currencyCode} />
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Settings">
        <DetailFieldGrid>
          <DetailField label="Minimum shares">{settings.minimumShares ?? '—'}</DetailField>
          <DetailField label="Nominal shares">{settings.nominalShares ?? '—'}</DetailField>
          <DetailField label="Maximum shares">{settings.maximumShares ?? '—'}</DetailField>
          <DetailField label="Minimum active period for dividends">
            {settings.minimumActivePeriodForDividends ?? '—'}
          </DetailField>
          <DetailField label="Minimum active period type">
            {enumOptionLabel(
              template.minimumActivePeriodFrequencyTypeOptions?.find(
                (o) => o.id === settings.minimumactiveperiodFrequencyType
              )
            ) ?? '—'}
          </DetailField>
          <DetailField label="Allow dividends for inactive clients">
            {formatYesNo(settings.allowDividendCalculationForInactiveClients)}
          </DetailField>
          {settings.enableLockinPeriod ? (
            <>
              <DetailField label="Lock-in frequency">
                {settings.lockinPeriodFrequency ?? '—'}
              </DetailField>
              <DetailField label="Lock-in frequency type">
                {enumOptionLabel(
                  template.lockinPeriodFrequencyTypeOptions?.find(
                    (o) => o.id === settings.lockinPeriodFrequencyType
                  )
                ) ?? '—'}
              </DetailField>
            </>
          ) : null}
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Market price">
        <DetailFieldGrid columns={1}>
          <DetailField label="Periods">
            {(marketPrice.marketPricePeriods ?? []).length > 0
              ? (marketPrice.marketPricePeriods ?? [])
                  .map(
                    (row) =>
                      `${formatFineractDateArray(row.fromDate) ?? row.fromDate}: ${row.shareValue}`
                  )
                  .join('; ')
              : 'None'}
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
              <DetailField label="Share reference">
                {glLabelFromOptions(allGlOptions, accounting.shareReferenceId)}
              </DetailField>
              <DetailField label="Share suspense">
                {glLabelFromOptions(allGlOptions, accounting.shareSuspenseId)}
              </DetailField>
              <DetailField label="Share equity">
                {glLabelFromOptions(allGlOptions, accounting.shareEquityId)}
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

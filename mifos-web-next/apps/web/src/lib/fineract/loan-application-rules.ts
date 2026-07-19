/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientLoanAccountTemplate } from '@mifos/api-client';
import type { LoanProductAttributeOverrides } from '@mifos/api-client';
import type { CreateLoanAccountInput, LoanApplicationProductContext } from '@mifos/validation';
import { computedLoanTermFrequency, computedNumberOfRepayments } from '@mifos/validation';
import { formatMoney } from '@mifos/domain';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import { draftHasAccountTransferCharge, loanApplicationChargeAmountLimits } from '@/lib/fineract/loan-application-charges';
import { loanProductAttributeOverridesEnabled } from '@/lib/fineract/loan-product-attribute-overrides';

export const LOAN_APPLICATION_LIVE_RANGE_FIELDS: Record<string, string[]> = {
  financial: ['principal', 'numberOfRepayments'],
  timeline: ['interestRatePerPeriod', 'interestRateDifferential']
};

export function loanApplicationProductContext(
  template: ClientLoanAccountTemplate
): LoanApplicationProductContext {
  return {
    minPrincipal: template.minPrincipal,
    maxPrincipal: template.maxPrincipal,
    minNumberOfRepayments: template.minNumberOfRepayments,
    maxNumberOfRepayments: template.maxNumberOfRepayments,
    minInterestRatePerPeriod: template.minInterestRatePerPeriod,
    maxInterestRatePerPeriod: template.maxInterestRatePerPeriod,
    minInterestRateDifferential: template.minInterestRateDifferential,
    maxInterestRateDifferential: template.maxInterestRateDifferential,
    linkedToFloatingInterestRates:
      template.linkedToFloatingInterestRates === true ||
      template.isLoanProductLinkedToFloatingRate === true,
    currencyCode: template.currency?.code
  };
}

export function loanApplicationValidationContext(
  template: ClientLoanAccountTemplate,
  draft: Pick<CreateLoanAccountInput, 'charges'>
): LoanApplicationProductContext {
  return {
    ...loanApplicationProductContext(template),
    hasAccountTransferCharge: draftHasAccountTransferCharge(template, draft.charges),
    chargeAmountLimits: loanApplicationChargeAmountLimits(template)
  };
}

export function isLoanApplicationFloatingProduct(
  template: ClientLoanAccountTemplate
): boolean {
  return loanApplicationProductContext(template).linkedToFloatingInterestRates === true;
}

export function loanApplicationOverrideLocked(
  overrides: LoanProductAttributeOverrides | undefined,
  key: keyof LoanProductAttributeOverrides
): boolean {
  if (!loanProductAttributeOverridesEnabled(overrides)) {
    return false;
  }
  return overrides?.[key] !== true;
}

export function loanApplicationGraceOverrideLocked(
  overrides: LoanProductAttributeOverrides | undefined
): boolean {
  return loanApplicationOverrideLocked(overrides, 'graceOnPrincipalAndInterestPayment');
}

export function loanApplicationHasEditableInterestSettings(
  template: ClientLoanAccountTemplate
): boolean {
  const overrides = template.allowAttributeOverrides;
  const floating = isLoanApplicationFloatingProduct(template);

  return (
    !loanApplicationOverrideLocked(overrides, 'amortizationType') ||
    (!floating && !loanApplicationOverrideLocked(overrides, 'interestType')) ||
    !loanApplicationOverrideLocked(overrides, 'interestCalculationPeriodType') ||
    !loanApplicationOverrideLocked(overrides, 'transactionProcessingStrategyCode')
  );
}

export function formatLoanApplicationRangeHint(
  min: number | undefined,
  max: number | undefined,
  suffix = ''
): string | undefined {
  if (min != null && max != null) {
    return `${min} – ${max}${suffix}`;
  }
  if (min != null) {
    return `Minimum ${min}${suffix}`;
  }
  if (max != null) {
    return `Maximum ${max}${suffix}`;
  }
  return undefined;
}

export function formatLoanApplicationMoneyRangeHint(
  min: number | undefined,
  max: number | undefined,
  currencyCode: string
): string | undefined {
  const formatAmount = (amount: number) => formatMoney(amount, currencyCode) ?? String(amount);

  if (min != null && max != null) {
    return `${formatAmount(min)} – ${formatAmount(max)}`;
  }
  if (min != null) {
    return `Minimum ${formatAmount(min)}`;
  }
  if (max != null) {
    return `Maximum ${formatAmount(max)}`;
  }
  return undefined;
}

export function loanApplicationAllowedRangeDescription(
  range: string | undefined
): string | undefined {
  return range ? `Allowed range: ${range}.` : undefined;
}

export function loanApplicationInterestRatePeriodUnit(
  frequencyType?: ClientLoanAccountTemplate['interestRateFrequencyType']
): string | undefined {
  const label = enumOptionLabel(frequencyType)?.trim();
  if (!label) {
    return undefined;
  }
  let lower = label.toLowerCase();
  if (lower.startsWith('per ')) {
    lower = lower.slice(4);
  }
  if (lower.endsWith('s') && lower.length > 1) {
    return lower.slice(0, -1);
  }
  return lower;
}

export function loanApplicationInterestRateFieldLabel(
  template: Pick<ClientLoanAccountTemplate, 'interestRateFrequencyType'>,
  options?: { includePercentInLabel?: boolean }
): string {
  const unit = loanApplicationInterestRatePeriodUnit(template.interestRateFrequencyType);
  const suffix = options?.includePercentInLabel === false ? '' : ' (%)';
  return unit ? `Interest rate per ${unit}${suffix}` : `Interest rate per period${suffix}`;
}

export function loanApplicationInterestRatePeriodDescription(
  template: Pick<ClientLoanAccountTemplate, 'interestRateFrequencyType'>
): string | undefined {
  const unit = loanApplicationInterestRatePeriodUnit(template.interestRateFrequencyType);
  return unit ? `This product expresses rates per ${unit}.` : undefined;
}

export function loanApplicationRateDifferentialFieldLabel(
  template: Pick<ClientLoanAccountTemplate, 'interestRateFrequencyType'>
): string {
  const unit = loanApplicationInterestRatePeriodUnit(template.interestRateFrequencyType);
  return unit ? `Rate differential (per ${unit})` : 'Rate differential';
}

export function loanApplicationRateDifferentialPeriodDescription(
  template: Pick<ClientLoanAccountTemplate, 'interestRateFrequencyType'>
): string | undefined {
  const unit = loanApplicationInterestRatePeriodUnit(template.interestRateFrequencyType);
  return unit
    ? `Spread added per ${unit} on top of the base floating rate.`
    : 'Spread over the base floating rate.';
}

export function joinLoanApplicationFieldDescriptions(
  ...parts: Array<string | undefined>
): string | undefined {
  const text = parts.filter(Boolean).join(' ');
  return text || undefined;
}

export function syncLoanTermFromRepayments(
  draft: Pick<
    CreateLoanAccountInput,
    | 'loanTermFrequency'
    | 'loanTermFrequencyType'
    | 'numberOfRepayments'
    | 'repaymentEvery'
    | 'repaymentFrequencyType'
  >
): Partial<CreateLoanAccountInput> {
  if (draft.loanTermFrequencyType !== draft.repaymentFrequencyType) {
    return { loanTermFrequencyType: draft.repaymentFrequencyType };
  }
  return {
    loanTermFrequency: computedLoanTermFrequency(
      draft.repaymentEvery,
      draft.numberOfRepayments
    ),
    loanTermFrequencyType: draft.repaymentFrequencyType
  };
}

export function syncRepaymentsFromLoanTerm(
  draft: Pick<
    CreateLoanAccountInput,
    | 'loanTermFrequency'
    | 'loanTermFrequencyType'
    | 'numberOfRepayments'
    | 'repaymentEvery'
    | 'repaymentFrequencyType'
  >
): Partial<CreateLoanAccountInput> {
  const alignedUnits =
    draft.loanTermFrequencyType !== draft.repaymentFrequencyType
      ? { repaymentFrequencyType: draft.loanTermFrequencyType }
      : {};

  const repayments = computedNumberOfRepayments(
    draft.loanTermFrequency,
    draft.repaymentEvery
  );

  if (repayments == null) {
    return alignedUnits;
  }

  return {
    ...alignedUnits,
    numberOfRepayments: repayments
  };
}

export function collateralCoverageTotal(
  template: ClientLoanAccountTemplate,
  collateral: CreateLoanAccountInput['collateral']
): number | undefined {
  if (!collateral?.length) {
    return undefined;
  }
  const options = template.loanCollateralOptions ?? [];
  let total = 0;
  let hasPricing = false;

  for (const row of collateral) {
    const option = options.find((item) => item.collateralId === row.collateralTypeId);
    if (option?.value == null) {
      continue;
    }
    hasPricing = true;
    const pct = option.pctToBase ?? 100;
    total += row.value * option.value * (pct / 100);
  }

  return hasPricing ? total : undefined;
}

export function filteredLoanApplicationStrategyOptions(
  template: ClientLoanAccountTemplate
): Array<{ value: string; label: string; keywords?: string[] }> {
  const options = (template.transactionProcessingStrategyOptions ?? []).map((option) => ({
    value: option.code ?? '',
    label: option.name ?? option.code ?? 'Strategy',
    keywords: [option.name ?? '', option.code ?? '']
  }));

  const scheduleType = template.loanScheduleType?.code ?? template.loanScheduleType?.value;
  if (scheduleType === 'PROGRESSIVE') {
    return options.filter((option) =>
      option.value.includes('advanced-payment-allocation')
    );
  }
  if (scheduleType === 'CUMULATIVE') {
    return options.filter(
      (option) => !option.value.includes('advanced-payment-allocation')
    );
  }
  return options;
}

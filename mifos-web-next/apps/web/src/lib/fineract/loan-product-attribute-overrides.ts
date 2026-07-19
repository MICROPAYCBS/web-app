/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  LoanProductAttributeOverrides,
  LoanProductKind
} from '@mifos/api-client';
import { LOAN_PRODUCT_KIND } from '@/lib/fineract/loan-product-paths';

export type LoanProductAttributeOverrideField = {
  key: keyof LoanProductAttributeOverrides;
  label: string;
};

export const LOAN_PRODUCT_LOAN_ATTRIBUTE_OVERRIDE_FIELDS: LoanProductAttributeOverrideField[] = [
  { key: 'amortizationType', label: 'Amortization' },
  { key: 'interestType', label: 'Interest method' },
  { key: 'transactionProcessingStrategyCode', label: 'Repayment strategy' },
  { key: 'interestCalculationPeriodType', label: 'Interest calculation period' },
  { key: 'inArrearsTolerance', label: 'Arrears tolerance' },
  { key: 'repaymentEvery', label: 'Repaid every' },
  { key: 'graceOnPrincipalAndInterestPayment', label: 'Moratorium' },
  {
    key: 'graceOnArrearsAgeing',
    label: 'Days overdue before moving into arrears'
  }
];

export const LOAN_PRODUCT_WORKING_CAPITAL_ATTRIBUTE_OVERRIDE_FIELDS: LoanProductAttributeOverrideField[] =
  [
    { key: 'breach', label: 'Breach' },
    { key: 'delinquencyBucketClassification', label: 'Delinquency bucket classification' },
    { key: 'discountDefault', label: 'Discount default' },
    { key: 'periodPaymentFrequency', label: 'Period payment frequency' },
    { key: 'periodPaymentFrequencyType', label: 'Period payment frequency type' }
  ];

export function loanProductAttributeOverrideFields(
  kind: LoanProductKind
): LoanProductAttributeOverrideField[] {
  return kind === LOAN_PRODUCT_KIND.WORKING_CAPITAL
    ? LOAN_PRODUCT_WORKING_CAPITAL_ATTRIBUTE_OVERRIDE_FIELDS
    : LOAN_PRODUCT_LOAN_ATTRIBUTE_OVERRIDE_FIELDS;
}

export function defaultLoanProductAttributeOverrides(
  kind: LoanProductKind,
  enabled = true
): LoanProductAttributeOverrides {
  const value = enabled;
  const overrides: LoanProductAttributeOverrides = {};
  for (const field of loanProductAttributeOverrideFields(kind)) {
    overrides[field.key] = value;
  }
  return overrides;
}

export function loanProductAttributeOverridesEnabled(
  overrides: LoanProductAttributeOverrides | undefined
): boolean {
  if (!overrides) {
    return false;
  }
  return Object.values(overrides).some(Boolean);
}

export function asLoanProductAttributeOverrides(
  raw: unknown
): LoanProductAttributeOverrides | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const overrides: LoanProductAttributeOverrides = {};
  for (const key of [
    'amortizationType',
    'interestType',
    'transactionProcessingStrategyCode',
    'interestCalculationPeriodType',
    'inArrearsTolerance',
    'repaymentEvery',
    'graceOnPrincipalAndInterestPayment',
    'graceOnArrearsAgeing',
    'delinquencyBucketClassification',
    'discountDefault',
    'periodPaymentFrequency',
    'periodPaymentFrequencyType',
    'breach'
  ] as const) {
    if (typeof row[key] === 'boolean') {
      overrides[key] = row[key];
    }
  }
  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

export function resolveLoanProductAttributeOverrideSettings(
  kind: LoanProductKind,
  rawOverrides: unknown
): {
  allowAttributeConfiguration: boolean;
  allowAttributeOverrides: LoanProductAttributeOverrides;
} {
  const defaults = defaultLoanProductAttributeOverrides(kind, true);
  const parsed = asLoanProductAttributeOverrides(rawOverrides) ?? {};
  const allowAttributeOverrides = { ...defaults, ...parsed };

  for (const field of loanProductAttributeOverrideFields(kind)) {
    if (allowAttributeOverrides[field.key] == null) {
      allowAttributeOverrides[field.key] = false;
    }
  }

  return {
    allowAttributeConfiguration: loanProductAttributeOverridesEnabled(allowAttributeOverrides),
    allowAttributeOverrides
  };
}

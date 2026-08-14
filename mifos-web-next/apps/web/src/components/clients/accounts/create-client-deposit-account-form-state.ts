/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind, ClientDepositAccountTemplate } from '@mifos/api-client';

export type DepositFormState = {
  productId: string;
  submittedOnDate: string;
  externalId: string;
  fieldOfficerId: string;
  depositAmount: string;
  depositPeriod: string;
  depositPeriodFrequencyId: string;
  recurringFrequency: string;
  recurringFrequencyType: string;
  mandatoryRecommendedDepositAmount: string;
  isCalendarInherited: boolean;
  nominalAnnualInterestRate: string;
  interestCompoundingPeriodType: string;
  interestPostingPeriodType: string;
  interestCalculationType: string;
  interestCalculationDaysInYearType: string;
  minRequiredOpeningBalance: string;
  withdrawalFeeForTransfers: boolean;
  lockinPeriodFrequency: string;
  lockinPeriodFrequencyType: string;
  allowOverdraft: boolean;
  overdraftLimit: string;
  minOverdraftForInterestCalculation: string;
  nominalAnnualInterestRateOverdraft: string;
  enforceMinRequiredBalance: boolean;
  minRequiredBalance: string;
};

export type SavingsAccountFormState = Pick<
  DepositFormState,
  | 'fieldOfficerId'
  | 'externalId'
  | 'nominalAnnualInterestRate'
  | 'interestCompoundingPeriodType'
  | 'interestPostingPeriodType'
  | 'interestCalculationType'
  | 'interestCalculationDaysInYearType'
  | 'minRequiredOpeningBalance'
  | 'withdrawalFeeForTransfers'
  | 'lockinPeriodFrequency'
  | 'lockinPeriodFrequencyType'
  | 'allowOverdraft'
  | 'overdraftLimit'
  | 'minOverdraftForInterestCalculation'
  | 'nominalAnnualInterestRateOverdraft'
  | 'enforceMinRequiredBalance'
  | 'minRequiredBalance'
>;

export function emptyDepositForm(submittedOnDate = ''): DepositFormState {
  return {
    productId: '',
    submittedOnDate,
    externalId: '',
    fieldOfficerId: '',
    depositAmount: '',
    depositPeriod: '',
    depositPeriodFrequencyId: '',
    recurringFrequency: '',
    recurringFrequencyType: '',
    mandatoryRecommendedDepositAmount: '',
    isCalendarInherited: false,
    nominalAnnualInterestRate: '',
    interestCompoundingPeriodType: '',
    interestPostingPeriodType: '',
    interestCalculationType: '',
    interestCalculationDaysInYearType: '',
    minRequiredOpeningBalance: '',
    withdrawalFeeForTransfers: false,
    lockinPeriodFrequency: '',
    lockinPeriodFrequencyType: '',
    allowOverdraft: false,
    overdraftLimit: '',
    minOverdraftForInterestCalculation: '',
    nominalAnnualInterestRateOverdraft: '',
    enforceMinRequiredBalance: false,
    minRequiredBalance: ''
  };
}

function enumId(value: { id?: number } | undefined): string {
  return value?.id != null ? String(value.id) : '';
}

function numberString(value: number | undefined): string {
  return value != null ? String(value) : '';
}

export function applySavingsTemplateDefaults(
  template: ClientDepositAccountTemplate
): Partial<DepositFormState> {
  return {
    nominalAnnualInterestRate: numberString(template.nominalAnnualInterestRate),
    interestCompoundingPeriodType: enumId(template.interestCompoundingPeriodType),
    interestPostingPeriodType: enumId(template.interestPostingPeriodType),
    interestCalculationType: enumId(template.interestCalculationType),
    interestCalculationDaysInYearType: enumId(template.interestCalculationDaysInYearType),
    minRequiredOpeningBalance: numberString(template.minRequiredOpeningBalance),
    withdrawalFeeForTransfers: template.withdrawalFeeForTransfers ?? false,
    lockinPeriodFrequency: numberString(template.lockinPeriodFrequency),
    lockinPeriodFrequencyType: enumId(template.lockinPeriodFrequencyType),
    allowOverdraft: template.allowOverdraft ?? false,
    overdraftLimit: numberString(template.overdraftLimit),
    minOverdraftForInterestCalculation: numberString(template.minOverdraftForInterestCalculation),
    nominalAnnualInterestRateOverdraft: numberString(template.nominalAnnualInterestRateOverdraft),
    enforceMinRequiredBalance: template.enforceMinRequiredBalance ?? false,
    minRequiredBalance: numberString(template.minRequiredBalance)
  };
}

export function applyDepositTemplateDefaults(
  template: ClientDepositAccountTemplate,
  kind: ClientDepositAccountKind
): Partial<DepositFormState> {
  const patch: Partial<DepositFormState> = {};
  if (template.depositAmount != null) {
    patch.depositAmount = String(template.depositAmount);
  }
  if (template.mandatoryRecommendedDepositAmount != null) {
    patch.mandatoryRecommendedDepositAmount = String(template.mandatoryRecommendedDepositAmount);
  }
  if (template.recurringFrequency != null) {
    patch.recurringFrequency = String(template.recurringFrequency);
  }
  if (template.recurringFrequencyType?.id != null) {
    patch.recurringFrequencyType = String(template.recurringFrequencyType.id);
  } else if (template.recurringFrequencyTypeOptions?.[0]?.id != null) {
    patch.recurringFrequencyType = String(template.recurringFrequencyTypeOptions[0].id);
  }
  if (kind !== 'savings') {
    if (template.minDepositTermType?.id != null) {
      patch.depositPeriodFrequencyId = String(template.minDepositTermType.id);
    } else {
      const periodType = template.periodFrequencyTypeOptions?.[0]?.id;
      if (periodType != null) {
        patch.depositPeriodFrequencyId = String(periodType);
      }
    }
    if (template.minDepositTerm != null) {
      patch.depositPeriod = String(template.minDepositTerm);
    }
  }
  if (kind === 'savings') {
    Object.assign(patch, applySavingsTemplateDefaults(template));
  }
  return patch;
}

export function clearSavingsAdvancedFields(): Partial<DepositFormState> {
  return {
    externalId: '',
    nominalAnnualInterestRate: '',
    interestCompoundingPeriodType: '',
    interestPostingPeriodType: '',
    interestCalculationType: '',
    interestCalculationDaysInYearType: '',
    minRequiredOpeningBalance: '',
    withdrawalFeeForTransfers: false,
    lockinPeriodFrequency: '',
    lockinPeriodFrequencyType: '',
    allowOverdraft: false,
    overdraftLimit: '',
    minOverdraftForInterestCalculation: '',
    nominalAnnualInterestRateOverdraft: '',
    enforceMinRequiredBalance: false,
    minRequiredBalance: ''
  };
}

export function buildSavingsFormPayload(form: DepositFormState) {
  return {
    productId: form.productId,
    submittedOnDate: form.submittedOnDate,
    externalId: form.externalId,
    fieldOfficerId: form.fieldOfficerId,
    nominalAnnualInterestRate: form.nominalAnnualInterestRate,
    interestCompoundingPeriodType: form.interestCompoundingPeriodType,
    interestPostingPeriodType: form.interestPostingPeriodType,
    interestCalculationType: form.interestCalculationType,
    interestCalculationDaysInYearType: form.interestCalculationDaysInYearType,
    minRequiredOpeningBalance: form.minRequiredOpeningBalance,
    withdrawalFeeForTransfers: form.withdrawalFeeForTransfers,
    lockinPeriodFrequency: form.lockinPeriodFrequency,
    lockinPeriodFrequencyType: form.lockinPeriodFrequencyType,
    allowOverdraft: form.allowOverdraft,
    overdraftLimit: form.overdraftLimit,
    minOverdraftForInterestCalculation: form.minOverdraftForInterestCalculation,
    nominalAnnualInterestRateOverdraft: form.nominalAnnualInterestRateOverdraft,
    enforceMinRequiredBalance: form.enforceMinRequiredBalance,
    minRequiredBalance: form.minRequiredBalance
  };
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ClientDepositAccountFieldOfficerOption,
  ClientDepositAccountProductOption,
  ClientDepositAccountTemplate,
  FineractEnumOption
} from '@mifos/api-client';
import { asProductDateString } from '@/lib/fineract/product-normalize';

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asEnumOption(value: unknown): FineractEnumOption | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  const id = toNumber(row.id);
  if (id == null) {
    return undefined;
  }
  return {
    id,
    code: typeof row.code === 'string' ? row.code : undefined,
    value: typeof row.value === 'string' ? row.value : undefined
  };
}

function asEnumOptions(value: unknown): FineractEnumOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => asEnumOption(item))
    .filter((item): item is FineractEnumOption => item !== undefined);
}

function asProductOptions(value: unknown): ClientDepositAccountProductOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const id = toNumber(row.id);
      const name = typeof row.name === 'string' ? row.name : undefined;
      if (id == null || !name) {
        return null;
      }
      return { id, name };
    })
    .filter((item): item is ClientDepositAccountProductOption => item !== null);
}

function asFieldOfficerOptions(value: unknown): ClientDepositAccountFieldOfficerOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const options: ClientDepositAccountFieldOfficerOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const id = toNumber(row.id);
    if (id == null) {
      continue;
    }
    options.push({
      id,
      ...(typeof row.displayName === 'string' ? { displayName: row.displayName } : {}),
      ...(typeof row.firstname === 'string' ? { firstname: row.firstname } : {}),
      ...(typeof row.lastname === 'string' ? { lastname: row.lastname } : {})
    });
  }
  return options;
}

export function normalizeClientDepositAccountTemplate(raw: unknown): ClientDepositAccountTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const currency =
    row.currency && typeof row.currency === 'object'
      ? (row.currency as ClientDepositAccountTemplate['currency'])
      : undefined;

  const periodFrequencyTypeOptions = asEnumOptions(
    row.periodFrequencyTypeOptions ??
      row.depositPeriodFrequencyTypeOptions ??
      row.termFrequencyTypeOptions
  );

  return {
    clientId: toNumber(row.clientId),
    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,
    savingsProductId: toNumber(row.savingsProductId ?? row.productId),
    savingsProductName:
      typeof row.savingsProductName === 'string'
        ? row.savingsProductName
        : typeof row.productName === 'string'
          ? row.productName
          : undefined,
    startDate: asProductDateString(row.startDate),
    closeDate: asProductDateString(row.closeDate),
    productOptions: asProductOptions(row.productOptions),
    fieldOfficerOptions: asFieldOfficerOptions(row.fieldOfficerOptions),
    termFrequencyTypeOptions: asEnumOptions(row.termFrequencyTypeOptions),
    periodFrequencyTypeOptions,
    recurringFrequencyTypeOptions: periodFrequencyTypeOptions,
    interestCompoundingPeriodTypeOptions: asEnumOptions(row.interestCompoundingPeriodTypeOptions),
    interestPostingPeriodTypeOptions: asEnumOptions(row.interestPostingPeriodTypeOptions),
    interestCalculationTypeOptions: asEnumOptions(row.interestCalculationTypeOptions),
    interestCalculationDaysInYearTypeOptions: asEnumOptions(
      row.interestCalculationDaysInYearTypeOptions
    ),
    lockinPeriodFrequencyTypeOptions: asEnumOptions(row.lockinPeriodFrequencyTypeOptions),
    currency,
    nominalAnnualInterestRate: toNumber(row.nominalAnnualInterestRate),
    interestCompoundingPeriodType: asEnumOption(row.interestCompoundingPeriodType),
    interestPostingPeriodType: asEnumOption(row.interestPostingPeriodType),
    interestCalculationType: asEnumOption(row.interestCalculationType),
    interestCalculationDaysInYearType: asEnumOption(row.interestCalculationDaysInYearType),
    minRequiredOpeningBalance: toNumber(row.minRequiredOpeningBalance),
    withdrawalFeeForTransfers:
      typeof row.withdrawalFeeForTransfers === 'boolean'
        ? row.withdrawalFeeForTransfers
        : undefined,
    lockinPeriodFrequency: toNumber(row.lockinPeriodFrequency),
    lockinPeriodFrequencyType: asEnumOption(row.lockinPeriodFrequencyType),
    allowOverdraft: typeof row.allowOverdraft === 'boolean' ? row.allowOverdraft : undefined,
    overdraftLimit: toNumber(row.overdraftLimit),
    minOverdraftForInterestCalculation: toNumber(row.minOverdraftForInterestCalculation),
    nominalAnnualInterestRateOverdraft: toNumber(row.nominalAnnualInterestRateOverdraft),
    enforceMinRequiredBalance:
      typeof row.enforceMinRequiredBalance === 'boolean' ? row.enforceMinRequiredBalance : undefined,
    minRequiredBalance: toNumber(row.minRequiredBalance),
    minDepositTerm: toNumber(row.minDepositTerm),
    maxDepositTerm: toNumber(row.maxDepositTerm),
    minDepositTermType: asEnumOption(row.minDepositTermType),
    maxDepositTermType: asEnumOption(row.maxDepositTermType),
    depositAmount: toNumber(row.depositAmount),
    mandatoryRecommendedDepositAmount: toNumber(
      row.mandatoryRecommendedDepositAmount ?? row.recurringDepositAmount
    ),
    recurringFrequency: toNumber(row.recurringFrequency ?? row.recurringDepositFrequency),
    recurringFrequencyType: asEnumOption(
      row.recurringFrequencyType ?? row.recurringDepositFrequencyType
    )
  };
}

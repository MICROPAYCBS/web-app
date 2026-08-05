/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SavingsProductTemplate } from '@mifos/api-client';
import type { UpsertSavingsProductInput } from '@mifos/validation';
import {
  filterCurrencyOptionsBySelected,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
import { filterTemplateChargeOptionsByCurrency } from '@/lib/fineract/product-charge-options';
import { productDraftAccountingRuleId } from '@/lib/fineract/product-display';
import {
  asAccountingMappings,
  asChargeIncomeMappings,
  asCurrency,
  asEnumOption,
  asPaymentChannelMappings,
  asProductDateString
} from '@/lib/fineract/product-normalize';

function enumId(value: unknown): number | undefined {
  return asEnumOption(value)?.id;
}

function enumIdFromOptions(options: unknown, fallbackIndex = 0): number | undefined {
  if (Array.isArray(options) && options.length > 0) {
    return asEnumOption(options[fallbackIndex])?.id;
  }
  return undefined;
}

function optionalAccountId(value: unknown): number | undefined {
  const id = typeof value === 'number' ? value : undefined;
  return Number.isFinite(id) ? id : undefined;
}

function mappingAccountId(
  mappings: Record<string, { id?: number } | undefined>,
  key: string
): number | undefined {
  return optionalAccountId(mappings[key]?.id);
}

export function savingsProductDraftFromTemplate(
  template: SavingsProductTemplate
): UpsertSavingsProductInput {
  const currency = template.currency ?? template.currencyOptions?.[0];
  const accountingRuleId = productDraftAccountingRuleId(
    asEnumOption(template.accountingRule),
    template.accountingRuleOptions
  );
  const mappings = template.accountingMappings ?? {};
  const lockinFrequency = Number(template.lockinPeriodFrequency ?? 0);
  const hasLockin = lockinFrequency > 0;

  return {
    details: {
      name: template.name ?? '',
      shortName: template.shortName ?? '',
      description: template.description ?? '',
      startDate: asProductDateString(template.startDate) ?? '',
      closeDate: asProductDateString(template.closeDate) ?? ''
    },
    currency: {
      currencyCode: currency?.code ?? template.currencyCode ?? '',
      digitsAfterDecimal: template.digitsAfterDecimal ?? currency?.decimalPlaces ?? 2,
      inMultiplesOf: template.inMultiplesOf,
    },
    terms: {
      nominalAnnualInterestRate: template.nominalAnnualInterestRate ?? 0,
      interestCompoundingPeriodType:
        enumId(template.interestCompoundingPeriodType) ??
        enumIdFromOptions(template.interestCompoundingPeriodTypeOptions) ??
        0,
      interestPostingPeriodType:
        enumId(template.interestPostingPeriodType) ??
        enumIdFromOptions(template.interestPostingPeriodTypeOptions) ??
        0,
      interestCalculationType:
        enumId(template.interestCalculationType) ??
        enumIdFromOptions(template.interestCalculationTypeOptions) ??
        0,
      interestCalculationDaysInYearType:
        enumId(template.interestCalculationDaysInYearType) ??
        enumIdFromOptions(template.interestCalculationDaysInYearTypeOptions) ??
        0
    },
    settings: {
      minRequiredOpeningBalance: template.minRequiredOpeningBalance,
      enableLockinPeriod: hasLockin,
      lockinPeriodFrequency: hasLockin ? lockinFrequency : undefined,
      lockinPeriodFrequencyType: hasLockin
        ? (enumId(template.lockinPeriodFrequencyType) ??
          enumIdFromOptions(template.lockinPeriodFrequencyTypeOptions))
        : undefined,
      withdrawalFeeForTransfers: Boolean(template.withdrawalFeeForTransfers),
      minBalanceForInterestCalculation: template.minBalanceForInterestCalculation,
      enforceMinRequiredBalance: Boolean(template.enforceMinRequiredBalance),
      minRequiredBalance: template.minRequiredBalance,
      allowOverdraft: Boolean(template.allowOverdraft),
      minOverdraftForInterestCalculation: template.minOverdraftForInterestCalculation,
      nominalAnnualInterestRateOverdraft: template.nominalAnnualInterestRateOverdraft,
      overdraftLimit: template.overdraftLimit,
      withHoldTax: Boolean(template.withHoldTax),
      taxGroupId: enumId(template.taxGroup),
      isDormancyTrackingActive: Boolean(template.isDormancyTrackingActive),
      daysToInactive: template.daysToInactive,
      daysToDormancy: template.daysToDormancy,
      daysToEscheat: template.daysToEscheat
    },
    charges: {
      chargeIds: (template.charges ?? []).map((c) => c.id).filter((id) => Number.isFinite(id))
    },
    accounting: {
      accountingRule: accountingRuleId,
      savingsReferenceAccountId: mappingAccountId(mappings, 'savingsReferenceAccount'),
      overdraftPortfolioControlId: mappingAccountId(mappings, 'overdraftPortfolioControl'),
      savingsControlAccountId: mappingAccountId(mappings, 'savingsControlAccount'),
      transfersInSuspenseAccountId: mappingAccountId(mappings, 'transfersInSuspenseAccount'),
      interestOnSavingsAccountId: mappingAccountId(mappings, 'interestOnSavingsAccount'),
      writeOffAccountId: mappingAccountId(mappings, 'writeOffAccount'),
      incomeFromFeeAccountId: mappingAccountId(mappings, 'incomeFromFeeAccount'),
      incomeFromPenaltyAccountId: mappingAccountId(mappings, 'incomeFromPenaltyAccount'),
      incomeFromInterestId: mappingAccountId(mappings, 'incomeFromInterest'),
      feesReceivableAccountId: mappingAccountId(mappings, 'feeReceivableAccount'),
      penaltiesReceivableAccountId: mappingAccountId(mappings, 'penaltyReceivableAccount'),
      interestReceivableAccountId: mappingAccountId(mappings, 'interestReceivableAccount'),
      interestPayableAccountId: mappingAccountId(mappings, 'interestPayableAccount'),
      escheatLiabilityId: mappingAccountId(mappings, 'escheatLiabilityAccount'),
      paymentChannelToFundSourceMappings: asPaymentChannelMappings(
        template.paymentChannelToFundSourceMappings
      ).map((row) => ({
        paymentTypeId: row.paymentType?.id ?? 0,
        fundSourceAccountId: row.fundSourceAccount?.id ?? 0
      })),
      feeToIncomeAccountMappings: asChargeIncomeMappings(template.feeToIncomeAccountMappings).map(
        (row) => ({
          chargeId: row.charge?.id ?? 0,
          incomeAccountId: row.incomeAccount?.id ?? 0
        })
      ),
      penaltyToIncomeAccountMappings: asChargeIncomeMappings(
        template.penaltyToIncomeAccountMappings
      ).map((row) => ({
        chargeId: row.charge?.id ?? 0,
        incomeAccountId: row.incomeAccount?.id ?? 0
      }))
    }
  };
}

export async function enrichSavingsProductTemplate(
  template: SavingsProductTemplate
): Promise<SavingsProductTemplate> {
  const selected = await getOrganizationSelectedCurrencies();
  const currencyOptions = filterCurrencyOptionsBySelected(
    template.currencyOptions ?? [],
    selected,
    template.currencyCode ?? template.currency?.code
  );
  const asset = template.accountingMappingOptions?.assetAccountOptions ?? [];
  const liability = template.accountingMappingOptions?.liabilityAccountOptions ?? [];
  return filterTemplateChargeOptionsByCurrency({
    ...template,
    currencyOptions,
    accountingMappingOptions: {
      ...template.accountingMappingOptions,
      assetAccountOptions: asset.concat(liability)
    }
  });
}

export function normalizeSavingsProductTemplate(raw: unknown): SavingsProductTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const accountingMappingOptions =
    row.accountingMappingOptions && typeof row.accountingMappingOptions === 'object'
      ? (row.accountingMappingOptions as SavingsProductTemplate['accountingMappingOptions'])
      : undefined;

  return {
    ...(row as SavingsProductTemplate),
    startDate: asProductDateString(row.startDate),
    closeDate: asProductDateString(row.closeDate),
    currency: asCurrency(row.currency),
    accountingMappings: asAccountingMappings(row.accountingMappings),
    accountingMappingOptions,
    accountingRule: asEnumOption(row.accountingRule),
    interestCompoundingPeriodType: asEnumOption(row.interestCompoundingPeriodType),
    interestPostingPeriodType: asEnumOption(row.interestPostingPeriodType),
    interestCalculationType: asEnumOption(row.interestCalculationType),
    interestCalculationDaysInYearType: asEnumOption(row.interestCalculationDaysInYearType),
    lockinPeriodFrequencyType: asEnumOption(row.lockinPeriodFrequencyType),
    taxGroup: asEnumOption(row.taxGroup)
  };
}

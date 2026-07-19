/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DepositProductInterestChart,
  DepositProductInterestChartSlab,
  DepositProductKind
} from '@mifos/api-client';
import type { DepositProductTemplate } from '@mifos/api-client';
import type { UpsertDepositProductInput } from '@mifos/validation';
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
  asPaymentChannelMappings
} from '@/lib/fineract/product-normalize';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import { depositProductConfig } from '@/lib/fineract/deposit-product-config';

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

function normalizeCharts(raw: unknown): DepositProductInterestChart[] {
  if (!raw) {
    return [];
  }
  const items = Array.isArray(raw) ? raw : [raw];
  return items.filter((item) => item && typeof item === 'object') as DepositProductInterestChart[];
}

function chartSlabsFromChart(chart: DepositProductInterestChart): DepositProductInterestChartSlab[] {
  const slabs = chart.chartSlabs;
  if (!slabs) {
    return [];
  }
  return Array.isArray(slabs) ? slabs : [slabs];
}

function draftChartsFromTemplate(template: DepositProductTemplate): UpsertDepositProductInput['interestRateChart'] {
  const charts = normalizeCharts(template.activeChart);
  if (charts.length === 0) {
    const periodType = enumIdFromOptions(template.chartTemplate?.periodTypes);
    return {
      charts: [
        {
          fromDate: '',
          isPrimaryGroupingByAmount: false,
          chartSlabs: [
            {
              periodType,
              fromPeriod: undefined,
              annualInterestRate: undefined,
              description: 'Default',
              incentives: []
            }
          ]
        }
      ]
    };
  }

  return {
    charts: charts.map((chart) => ({
      id: chart.id,
      name: chart.name ?? '',
      description: chart.description ?? '',
      fromDate: fineractApiDateToFormString(chart.fromDate) ?? '',
      endDate: fineractApiDateToFormString(chart.endDate) ?? '',
      isPrimaryGroupingByAmount: Boolean(chart.isPrimaryGroupingByAmount),
      chartSlabs: chartSlabsFromChart(chart).map((slab) => ({
        id: slab.id,
        periodType: enumId(slab.periodType) ?? enumIdFromOptions(template.chartTemplate?.periodTypes),
        fromPeriod: slab.fromPeriod,
        toPeriod: slab.toPeriod,
        amountRangeFrom: slab.amountRangeFrom,
        amountRangeTo: slab.amountRangeTo,
        annualInterestRate: slab.annualInterestRate,
        description: slab.description ?? '',
        incentives: (slab.incentives ?? []).map((incentive) => ({
          entityType: enumId(incentive.entityType) ?? 0,
          attributeName: enumId(incentive.attributeName) ?? 0,
          conditionType: enumId(incentive.conditionType) ?? 0,
          attributeValue: incentive.attributeValue ?? '',
          incentiveType: enumId(incentive.incentiveType) ?? 0,
          amount: incentive.amount ?? 0
        }))
      }))
    }))
  };
}

export function depositProductDraftFromTemplate(
  kind: DepositProductKind,
  template: DepositProductTemplate
): UpsertDepositProductInput {
  const config = depositProductConfig(kind);
  const currency = template.currency ?? template.currencyOptions?.[0];
  const accountingRuleId = productDraftAccountingRuleId(
    asEnumOption(template.accountingRule),
    template.accountingRuleOptions
  );
  const mappings = template.accountingMappings ?? {};
  const lockinFrequency = Number(template.lockinPeriodFrequency ?? 0);
  const hasLockin = lockinFrequency > 0;
  const hasAdvancedMappings =
    (asPaymentChannelMappings(template.paymentChannelToFundSourceMappings).length ?? 0) > 0 ||
    (asChargeIncomeMappings(template.feeToIncomeAccountMappings).length ?? 0) > 0 ||
    (asChargeIncomeMappings(template.penaltyToIncomeAccountMappings).length ?? 0) > 0;

  return {
    variant: kind,
    details: {
      name: template.name ?? '',
      shortName: template.shortName ?? '',
      description: template.description ?? ''
    },
    currency: {
      currencyCode: currency?.code ?? template.currencyCode ?? '',
      digitsAfterDecimal: template.digitsAfterDecimal ?? currency?.decimalPlaces ?? 2,
      inMultiplesOf: template.inMultiplesOf
    },
    terms: {
      minDepositAmount: template.minDepositAmount,
      depositAmount: template.depositAmount,
      maxDepositAmount: template.maxDepositAmount,
      interestCompoundingPeriodType:
        enumId(template.interestCompoundingPeriodType) ??
        enumIdFromOptions(template.interestCompoundingPeriodTypeOptions),
      interestPostingPeriodType:
        enumId(template.interestPostingPeriodType) ??
        enumIdFromOptions(template.interestPostingPeriodTypeOptions),
      interestCalculationType:
        enumId(template.interestCalculationType) ??
        enumIdFromOptions(template.interestCalculationTypeOptions),
      interestCalculationDaysInYearType:
        enumId(template.interestCalculationDaysInYearType) ??
        enumIdFromOptions(template.interestCalculationDaysInYearTypeOptions)
    },
    settings: {
      ...(config.isRecurring
        ? {
            isMandatoryDeposit: Boolean(template.isMandatoryDeposit),
            adjustAdvanceTowardsFuturePayments: Boolean(
              template.adjustAdvanceTowardsFuturePayments
            ),
            allowWithdrawal: Boolean(template.allowWithdrawal)
          }
        : {}),
      enableLockinPeriod: hasLockin,
      lockinPeriodFrequency: hasLockin ? lockinFrequency : undefined,
      lockinPeriodFrequencyType: hasLockin
        ? (enumId(template.lockinPeriodFrequencyType) ??
          enumIdFromOptions(template.lockinPeriodFrequencyTypeOptions))
        : undefined,
      minDepositTerm: template.minDepositTerm,
      minDepositTermTypeId:
        enumId(template.minDepositTermType) ??
        enumIdFromOptions(template.periodFrequencyTypeOptions?.slice(0, -1)),
      inMultiplesOfDepositTerm: template.inMultiplesOfDepositTerm,
      inMultiplesOfDepositTermTypeId: enumId(template.inMultiplesOfDepositTermType),
      maxDepositTerm: template.maxDepositTerm,
      maxDepositTermTypeId: enumId(template.maxDepositTermType),
      preClosurePenalApplicable: Boolean(template.preClosurePenalApplicable),
      preClosurePenalInterest: template.preClosurePenalInterest,
      preClosurePenalInterestOnTypeId: enumId(template.preClosurePenalInterestOnType),
      withHoldTax: Boolean(template.withHoldTax),
      taxGroupId: enumId(template.taxGroup)
    },
    interestRateChart: draftChartsFromTemplate(template),
    charges: {
      chargeIds: (template.charges ?? []).map((c) => c.id).filter((id) => Number.isFinite(id))
    },
    accounting: {
      accountingRule: accountingRuleId,
      savingsReferenceAccountId: mappingAccountId(mappings, 'savingsReferenceAccount'),
      savingsControlAccountId: mappingAccountId(mappings, 'savingsControlAccount'),
      transfersInSuspenseAccountId: mappingAccountId(mappings, 'transfersInSuspenseAccount'),
      interestOnSavingsAccountId: mappingAccountId(mappings, 'interestOnSavingsAccount'),
      incomeFromFeeAccountId: mappingAccountId(mappings, 'incomeFromFeeAccount'),
      incomeFromPenaltyAccountId: mappingAccountId(mappings, 'incomeFromPenaltyAccount'),
      feesReceivableAccountId: mappingAccountId(mappings, 'feeReceivableAccount'),
      penaltiesReceivableAccountId: mappingAccountId(mappings, 'penaltyReceivableAccount'),
      interestPayableAccountId: mappingAccountId(mappings, 'interestPayableAccount'),
      advancedAccountingRules: hasAdvancedMappings,
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

export async function enrichDepositProductTemplate(
  template: DepositProductTemplate
): Promise<DepositProductTemplate> {
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

export function normalizeDepositProductTemplate(raw: unknown): DepositProductTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const accountingMappingOptions =
    row.accountingMappingOptions && typeof row.accountingMappingOptions === 'object'
      ? (row.accountingMappingOptions as DepositProductTemplate['accountingMappingOptions'])
      : undefined;

  return {
    ...(row as DepositProductTemplate),
    currency: asCurrency(row.currency),
    accountingMappings: asAccountingMappings(row.accountingMappings),
    accountingMappingOptions,
    accountingRule: asEnumOption(row.accountingRule),
    interestCompoundingPeriodType: asEnumOption(row.interestCompoundingPeriodType),
    interestPostingPeriodType: asEnumOption(row.interestPostingPeriodType),
    interestCalculationType: asEnumOption(row.interestCalculationType),
    interestCalculationDaysInYearType: asEnumOption(row.interestCalculationDaysInYearType),
    lockinPeriodFrequencyType: asEnumOption(row.lockinPeriodFrequencyType),
    minDepositTermType: asEnumOption(row.minDepositTermType),
    inMultiplesOfDepositTermType: asEnumOption(row.inMultiplesOfDepositTermType),
    maxDepositTermType: asEnumOption(row.maxDepositTermType),
    preClosurePenalInterestOnType: asEnumOption(row.preClosurePenalInterestOnType),
    taxGroup: asEnumOption(row.taxGroup),
    activeChart: normalizeCharts(row.activeChart)
  };
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanProductKind, LoanProductTemplate } from '@mifos/api-client';
import type { UpsertLoanProductInput } from '@mifos/validation';
import {
  filterCurrencyOptionsBySelected,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
import { resolveLoanProductAttributeOverrideSettings } from '@/lib/fineract/loan-product-attribute-overrides';
import { filterTemplateChargeOptionsByCurrency } from '@/lib/fineract/product-charge-options';
import { productDraftAccountingRuleId } from '@/lib/fineract/product-display';
import {
  asAccountingMappings,
  asChargeIncomeMappings,
  asCurrency,
  asEnumOption,
  asPaymentChannelMappings,
  resolveEnumOptionId
} from '@/lib/fineract/product-normalize';

function enumId(value: unknown): number | undefined {
  const option = asEnumOption(value);
  return option?.id;
}

function enumIdFromOptions(
  options: unknown,
  fallbackIndex = 0
): number | undefined {
  if (Array.isArray(options) && options.length > 0) {
    const first = asEnumOption(options[fallbackIndex]);
    return first?.id;
  }
  return undefined;
}

function strategyCode(template: LoanProductTemplate): string {
  if (typeof template.transactionProcessingStrategyCode === 'string') {
    return template.transactionProcessingStrategyCode;
  }
  const options = template.transactionProcessingStrategyOptions;
  if (Array.isArray(options) && options[0]?.code) {
    return options[0].code;
  }
  return '';
}

function optionalAccountId(value: unknown): number | undefined {
  const id = typeof value === 'number' ? value : undefined;
  return Number.isFinite(id) ? id : undefined;
}

export function loanProductDraftFromTemplate(
  template: LoanProductTemplate,
  productKind: LoanProductKind
): UpsertLoanProductInput {
  const currency = template.currency ?? template.currencyOptions?.[0];
  const accountingRuleId = productDraftAccountingRuleId(
    asEnumOption(template.accountingRule),
    template.accountingRuleOptions
  );
  const mappings = template.accountingMappings ?? {};
  const attributeOverrides = resolveLoanProductAttributeOverrideSettings(
    productKind,
    template.allowAttributeOverrides
  );

  return {
    details: {
      name: template.name ?? '',
      shortName: template.shortName ?? '',
      description: template.description ?? '',
      externalId: template.externalId ?? '',
      fundId: template.fundId,
      startDate: template.startDate ?? '',
      closeDate: template.closeDate ?? '',
      includeInBorrowerCycle: template.includeInBorrowerCycle ?? false
    },
    currency: {
      currencyCode: currency?.code ?? template.currencyCode ?? '',
      digitsAfterDecimal: template.digitsAfterDecimal ?? currency?.decimalPlaces ?? 2,
      inMultiplesOf: template.inMultiplesOf,
      installmentAmountInMultiplesOf:
        template.installmentAmountInMultiplesOf != null &&
        template.installmentAmountInMultiplesOf > 0
          ? template.installmentAmountInMultiplesOf
          : undefined
    },
    terms: {
      isLinkedToFloatingInterestRates: template.isLinkedToFloatingInterestRates ?? false,
      principal: template.principal ?? 0,
      minPrincipal: template.minPrincipal,
      maxPrincipal: template.maxPrincipal,
      numberOfRepayments: template.numberOfRepayments ?? 1,
      minNumberOfRepayments: template.minNumberOfRepayments,
      maxNumberOfRepayments: template.maxNumberOfRepayments,
      repaymentEvery: template.repaymentEvery ?? 1,
      repaymentFrequencyType:
        enumId(template.repaymentFrequencyType) ??
        enumIdFromOptions(template.repaymentFrequencyTypeOptions) ??
        0,
      interestRatePerPeriod: template.interestRatePerPeriod ?? 0,
      minInterestRatePerPeriod: template.minInterestRatePerPeriod,
      maxInterestRatePerPeriod: template.maxInterestRatePerPeriod,
      interestRateFrequencyType:
        enumId(template.interestRateFrequencyType) ??
        enumIdFromOptions(template.interestRateFrequencyTypeOptions) ??
        2,
      isFloatingInterestRateCalculationAllowed: false,
      repaymentStartDateType:
        resolveEnumOptionId(
          template.repaymentStartDateType,
          template.repaymentStartDateTypeOptions
        ) ??
        enumIdFromOptions(template.repaymentStartDateTypeOptions) ??
        1
    },
    settings: {
      amortizationType:
        enumId(template.amortizationType) ??
        enumIdFromOptions(template.amortizationTypeOptions) ??
        0,
      interestType:
        enumId(template.interestType) ?? enumIdFromOptions(template.interestTypeOptions) ?? 0,
      isEqualAmortization: Boolean(template.isEqualAmortization),
      interestCalculationPeriodType:
        enumId(template.interestCalculationPeriodType) ??
        enumIdFromOptions(template.interestCalculationPeriodTypeOptions) ??
        0,
      allowPartialPeriodInterestCalculation: Boolean(template.allowPartialPeriodInterestCalculation),
      transactionProcessingStrategyCode: strategyCode(template),
      graceOnPrincipalPayment: Number(template.graceOnPrincipalPayment ?? 0),
      graceOnInterestPayment: Number(template.graceOnInterestPayment ?? 0),
      graceOnInterestCharged: Number(template.graceOnInterestCharged ?? 0),
      inArrearsTolerance: Number(template.inArrearsTolerance ?? 0),
      daysInYearType:
        enumId(template.daysInYearType) ??
        enumIdFromOptions(template.daysInYearTypeOptions) ??
        1,
      daysInMonthType:
        enumId(template.daysInMonthType) ??
        enumIdFromOptions(template.daysInMonthTypeOptions) ??
        1,
      canDefineInstallmentAmount: Boolean(template.canDefineInstallmentAmount),
      graceOnArrearsAgeing: Number(template.graceOnArrearsAgeing ?? 0),
      overdueDaysForNPA: Number(template.overdueDaysForNPA ?? 0),
      accountMovesOutOfNPAOnlyOnArrearsCompletion: Boolean(
        template.accountMovesOutOfNPAOnlyOnArrearsCompletion
      ),
      principalThresholdForLastInstallment: Number(
        template.principalThresholdForLastInstallment ?? 0
      ),
      allowVariableInstallments: Boolean(template.allowVariableInstallments),
      disallowExpectedDisbursements: Boolean(template.disallowExpectedDisbursements),
      canUseForTopup: Boolean(template.canUseForTopup),
      isInterestRecalculationEnabled: Boolean(template.isInterestRecalculationEnabled),
      holdGuaranteeFunds: Boolean(template.holdGuaranteeFunds),
      multiDisburseLoan: Boolean(template.multiDisburseLoan),
      allowFullTermForTranche: Boolean(template.allowFullTermForTranche),
      enableDownPayment: Boolean(template.enableDownPayment),
      enableInstallmentLevelDelinquency: Boolean(template.enableInstallmentLevelDelinquency),
      delinquencyBucketId: enumId(template.delinquencyBucket),
      useDueForRepaymentsConfigurations: false,
      dueDaysForRepaymentEvent: Number(template.dueDaysForRepaymentEvent ?? 0),
      overDueDaysForRepaymentEvent: Number(template.overDueDaysForRepaymentEvent ?? 0),
      loanScheduleType:
        resolveEnumOptionId(template.loanScheduleType, template.loanScheduleTypeOptions) ??
        enumIdFromOptions(template.loanScheduleTypeOptions) ??
        0,
      loanScheduleProcessingType: resolveEnumOptionId(
        template.loanScheduleProcessingType,
        template.loanScheduleProcessingTypeOptions
      ),
      allowAccrualPostingInArrears: Boolean(template.allowAccrualPostingInArrears),
      syncExpectedWithDisbursementDate: Boolean(template.syncExpectedWithDisbursementDate),
      allowApprovedDisbursedAmountsOverApplied: Boolean(
        template.allowApprovedDisbursedAmountsOverApplied
      ),
      allowAttributeConfiguration: attributeOverrides.allowAttributeConfiguration,
      allowAttributeOverrides: attributeOverrides.allowAttributeOverrides
    },
    charges: {
      chargeIds: (template.charges ?? []).map((c) => c.id).filter((id) => Number.isFinite(id))
    },
    accounting: {
      accountingRule: accountingRuleId,
      enableAccrualActivityPosting:
        accountingRuleId === 3 || accountingRuleId === 4
          ? Boolean(template.enableAccrualActivityPosting)
          : undefined,
      fundSourceAccountId:
        optionalAccountId(mappings.fundSourceAccount?.id ?? template.fundSourceAccountId),
      loanPortfolioAccountId: optionalAccountId(
        mappings.loanPortfolioAccount?.id ?? template.loanPortfolioAccountId
      ),
      transfersInSuspenseAccountId: optionalAccountId(
        mappings.transfersInSuspenseAccount?.id ?? template.transfersInSuspenseAccountId
      ),
      interestOnLoanAccountId: optionalAccountId(
        mappings.interestOnLoanAccount?.id ?? template.interestOnLoanAccountId
      ),
      incomeFromFeeAccountId: optionalAccountId(
        mappings.incomeFromFeeAccount?.id ?? template.incomeFromFeeAccountId
      ),
      incomeFromPenaltyAccountId: optionalAccountId(
        mappings.incomeFromPenaltyAccount?.id ?? template.incomeFromPenaltyAccountId
      ),
      incomeFromRecoveryAccountId: optionalAccountId(
        mappings.incomeFromRecoveryAccount?.id ?? template.incomeFromRecoveryAccountId
      ),
      writeOffAccountId: optionalAccountId(mappings.writeOffAccount?.id ?? template.writeOffAccountId),
      overpaymentLiabilityAccountId: optionalAccountId(
        mappings.overpaymentLiabilityAccount?.id ?? template.overpaymentLiabilityAccountId
      ),
      receivableInterestAccountId: optionalAccountId(
        mappings.receivableInterestAccount?.id ?? template.receivableInterestAccountId
      ),
      receivableFeeAccountId: optionalAccountId(
        mappings.receivableFeeAccount?.id ?? template.receivableFeeAccountId
      ),
      receivablePenaltyAccountId: optionalAccountId(
        mappings.receivablePenaltyAccount?.id ?? template.receivablePenaltyAccountId
      ),
      paymentChannelToFundSourceMappings: asPaymentChannelMappings(
        template.paymentChannelToFundSourceMappings
      ).map((row) => ({
        paymentTypeId: row.paymentType?.id ?? 0,
        fundSourceAccountId: row.fundSourceAccount?.id ?? 0
      })),
      feeToIncomeAccountMappings: asChargeIncomeMappings(
        template.feeToIncomeAccountMappings
      ).map((row) => ({
        chargeId: row.charge?.id ?? 0,
        incomeAccountId: row.incomeAccount?.id ?? 0
      })),
      penaltyToIncomeAccountMappings: asChargeIncomeMappings(
        template.penaltyToIncomeAccountMappings
      ).map((row) => ({
        chargeId: row.charge?.id ?? 0,
        incomeAccountId: row.incomeAccount?.id ?? 0
      }))
    }
  };
}

export async function enrichLoanProductTemplate(
  template: LoanProductTemplate
): Promise<LoanProductTemplate> {
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

export function normalizeLoanProductTemplate(raw: unknown): LoanProductTemplate {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const row = raw as Record<string, unknown>;
  const accountingMappingOptions =
    row.accountingMappingOptions && typeof row.accountingMappingOptions === 'object'
      ? (row.accountingMappingOptions as LoanProductTemplate['accountingMappingOptions'])
      : undefined;

  return {
    ...(row as LoanProductTemplate),
    currency: asCurrency(row.currency),
    accountingMappings: asAccountingMappings(row.accountingMappings),
    accountingMappingOptions,
    accountingRule: asEnumOption(row.accountingRule),
    repaymentFrequencyType: asEnumOption(row.repaymentFrequencyType),
    interestRateFrequencyType: asEnumOption(row.interestRateFrequencyType),
    amortizationType: asEnumOption(row.amortizationType),
    interestType: asEnumOption(row.interestType),
    interestCalculationPeriodType: asEnumOption(row.interestCalculationPeriodType),
    daysInYearType: asEnumOption(row.daysInYearType),
    daysInMonthType: asEnumOption(row.daysInMonthType),
    loanScheduleType: asEnumOption(row.loanScheduleType),
    loanScheduleProcessingType: asEnumOption(row.loanScheduleProcessingType),
    repaymentStartDateType: asEnumOption(row.repaymentStartDateType),
    delinquencyBucket: asEnumOption(row.delinquencyBucket)
  };
}

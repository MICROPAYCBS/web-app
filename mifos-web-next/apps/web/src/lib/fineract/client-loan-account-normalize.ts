/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type {

  ClientLoanAccountChargeOption,

  ClientLoanAccountTemplate,

  FineractEnumOption

} from '@mifos/api-client';

import { asLoanProductAttributeOverrides } from '@/lib/fineract/loan-product-attribute-overrides';



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



function asNamedOptions(value: unknown): Array<{ id: number; name: string }> {

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

    .filter((item): item is { id: number; name: string } => item !== null);

}



function asLoanCollateralOptions(

  value: unknown

): ClientLoanAccountTemplate['loanCollateralOptions'] {

  if (!Array.isArray(value)) {

    return [];

  }

  return value

    .map((item) => {

      if (!item || typeof item !== 'object') {

        return null;

      }

      const row = item as Record<string, unknown>;

      const collateralId = toNumber(row.collateralId ?? row.id);

      if (collateralId == null) {

        return null;

      }

      return {

        collateralId,

        name: typeof row.name === 'string' ? row.name : undefined,

        description: typeof row.description === 'string' ? row.description : undefined,

        value: toNumber(row.value ?? row.basePrice),

        pctToBase: toNumber(row.pctToBase)

      };

    })

    .filter((item): item is NonNullable<typeof item> => item !== null);

}



function flattenLoanAccountChargeRow(row: Record<string, unknown>): Record<string, unknown> {
  const nested = row.charge;
  if (!nested || typeof nested !== 'object') {
    return row;
  }

  const charge = nested as Record<string, unknown>;
  const currency =
    row.currency && typeof row.currency === 'object'
      ? row.currency
      : charge.currency && typeof charge.currency === 'object'
        ? charge.currency
        : undefined;

  return {
    ...charge,
    ...row,
    id: row.id ?? charge.id,
    chargeId: row.chargeId ?? charge.id ?? row.id,
    name: typeof row.name === 'string' ? row.name : charge.name,
    amount: row.amount ?? charge.amount,
    amountOrPercentage: row.amountOrPercentage ?? charge.amountOrPercentage,
    percentage: row.percentage ?? charge.percentage,
    penalty: row.penalty ?? charge.penalty,
    currency,
    currencyCode: row.currencyCode ?? charge.currencyCode,
    chargeCalculationType: row.chargeCalculationType ?? charge.chargeCalculationType,
    chargeTimeType: row.chargeTimeType ?? charge.chargeTimeType,
    chargePaymentMode: row.chargePaymentMode ?? charge.chargePaymentMode
  };
}

function chargeCurrencyFromRow(row: Record<string, unknown>): ClientLoanAccountChargeOption['currency'] {
  if (row.currency && typeof row.currency === 'object') {
    return row.currency as ClientLoanAccountChargeOption['currency'];
  }

  if (typeof row.currencyCode === 'string' && row.currencyCode.trim()) {
    return { code: row.currencyCode.trim() };
  }

  return undefined;
}

export function normalizeLoanAccountChargeOptions(
  value: unknown
): ClientLoanAccountChargeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const options: ClientLoanAccountChargeOption[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const row = flattenLoanAccountChargeRow(item as Record<string, unknown>);
    const chargeDefinitionId = toNumber(row.chargeId) ?? toNumber(row.id);

    if (chargeDefinitionId == null) {
      continue;
    }

    options.push({
      id: chargeDefinitionId,
      chargeId: chargeDefinitionId,
      name: typeof row.name === 'string' ? row.name : undefined,
      amount: toNumber(row.amount),
      amountOrPercentage: toNumber(row.amountOrPercentage),
      percentage: toNumber(row.percentage),
      penalty: row.penalty === true ? true : undefined,
      currency: chargeCurrencyFromRow(row),
      chargeCalculationType: asEnumOption(row.chargeCalculationType),
      chargeTimeType: asEnumOption(row.chargeTimeType),
      chargePaymentMode: asEnumOption(row.chargePaymentMode)
    });
  }

  return options;
}

function asLoanAccountChargeOptions(value: unknown): ClientLoanAccountChargeOption[] {
  return normalizeLoanAccountChargeOptions(value);
}

function loanTemplateSourceRow(raw: Record<string, unknown>): Record<string, unknown> {
  const loanData = raw.loanData;
  if (loanData && typeof loanData === 'object') {
    return { ...raw, ...(loanData as Record<string, unknown>) };
  }

  return raw;
}

/** Fineract puts product limits on nested `product`, not top-level loan template fields. */
function loanTemplateProductRow(
  row: Record<string, unknown>
): Record<string, unknown> | undefined {
  return row.product && typeof row.product === 'object'
    ? (row.product as Record<string, unknown>)
    : undefined;
}

function toNumberFromTemplateOrProduct(
  row: Record<string, unknown>,
  key: string
): number | undefined {
  return toNumber(row[key]) ?? toNumber(loanTemplateProductRow(row)?.[key]);
}

function stringFromTemplateOrProduct(
  row: Record<string, unknown>,
  key: string
): string | undefined {
  const top = row[key];
  if (typeof top === 'string' && top.trim()) {
    return top;
  }
  const nested = loanTemplateProductRow(row)?.[key];
  return typeof nested === 'string' && nested.trim() ? nested : undefined;
}



export function normalizeClientLoanAccountTemplate(raw: unknown): ClientLoanAccountTemplate {

  if (!raw || typeof raw !== 'object') {

    return {};

  }

  const row = loanTemplateSourceRow(raw as Record<string, unknown>);

  const productOptions = Array.isArray(row.productOptions)

    ? row.productOptions

        .map((item) => {

          if (!item || typeof item !== 'object') {

            return null;

          }

          const option = item as Record<string, unknown>;

          const id = toNumber(option.id);

          const name = typeof option.name === 'string' ? option.name : undefined;

          if (id == null || !name) {

            return null;

          }

          return { id, name };

        })

        .filter((item): item is { id: number; name: string } => item !== null)

    : [];



  const loanOfficerOptions: ClientLoanAccountTemplate['loanOfficerOptions'] = Array.isArray(

    row.loanOfficerOptions

  )

    ? row.loanOfficerOptions

        .map((item) => {

          if (!item || typeof item !== 'object') {

            return null;

          }

          const officer = item as Record<string, unknown>;

          const id = toNumber(officer.id);

          if (id == null) {

            return null;

          }

          return {

            id,

            displayName:

              typeof officer.displayName === 'string' ? officer.displayName : undefined

          };

        })

        .filter((item): item is NonNullable<typeof item> => item !== null)

    : [];



  const accountLinkingOptions: ClientLoanAccountTemplate['accountLinkingOptions'] = Array.isArray(

    row.accountLinkingOptions

  )

    ? row.accountLinkingOptions

        .map((item) => {

          if (!item || typeof item !== 'object') {

            return null;

          }

          const account = item as Record<string, unknown>;

          const id = toNumber(account.id);

          if (id == null) {

            return null;

          }

          return {

            id,

            accountNo: typeof account.accountNo === 'string' ? account.accountNo : undefined

          };

        })

        .filter((item): item is NonNullable<typeof item> => item !== null)

    : [];



  const transactionProcessingStrategyOptions: ClientLoanAccountTemplate['transactionProcessingStrategyOptions'] =

    Array.isArray(row.transactionProcessingStrategyOptions)

      ? row.transactionProcessingStrategyOptions

          .map((item) => {

            if (!item || typeof item !== 'object') {

              return null;

            }

            const strategy = item as Record<string, unknown>;

            return {

              code: typeof strategy.code === 'string' ? strategy.code : undefined,

              name: typeof strategy.name === 'string' ? strategy.name : undefined

            };

          })

          .filter((item): item is NonNullable<typeof item> => item !== null)

      : [];



  const currency =

    row.currency && typeof row.currency === 'object'

      ? (row.currency as ClientLoanAccountTemplate['currency'])

      : undefined;



  return {

    clientId: toNumber(row.clientId),

    clientName: typeof row.clientName === 'string' ? row.clientName : undefined,

    productOptions,

    loanOfficerOptions,

    fundOptions: asNamedOptions(row.fundOptions),

    loanPurposeOptions: asNamedOptions(row.loanPurposeOptions),

    loanCollateralOptions: asLoanCollateralOptions(row.loanCollateralOptions),

    accountLinkingOptions,

    amortizationTypeOptions: asEnumOptions(row.amortizationTypeOptions),

    interestTypeOptions: asEnumOptions(row.interestTypeOptions),

    interestCalculationPeriodTypeOptions: asEnumOptions(

      row.interestCalculationPeriodTypeOptions

    ),

    termFrequencyTypeOptions: asEnumOptions(row.termFrequencyTypeOptions),

    repaymentFrequencyTypeOptions: asEnumOptions(row.repaymentFrequencyTypeOptions),

    transactionProcessingStrategyOptions,

    currency,

    principal: toNumber(row.principal),

    minPrincipal: toNumberFromTemplateOrProduct(row, 'minPrincipal'),

    maxPrincipal: toNumberFromTemplateOrProduct(row, 'maxPrincipal'),

    loanTermFrequency: toNumber(row.loanTermFrequency) ?? toNumber(row.termFrequency),

    loanTermFrequencyType:
      asEnumOption(row.loanTermFrequencyType) ?? asEnumOption(row.termPeriodFrequencyType),

    numberOfRepayments: toNumber(row.numberOfRepayments),

    minNumberOfRepayments: toNumberFromTemplateOrProduct(row, 'minNumberOfRepayments'),

    maxNumberOfRepayments: toNumberFromTemplateOrProduct(row, 'maxNumberOfRepayments'),

    repaymentEvery: toNumber(row.repaymentEvery),

    repaymentFrequencyType: asEnumOption(row.repaymentFrequencyType),

    interestRatePerPeriod: toNumber(row.interestRatePerPeriod),

    minInterestRatePerPeriod: toNumberFromTemplateOrProduct(row, 'minInterestRatePerPeriod'),

    maxInterestRatePerPeriod: toNumberFromTemplateOrProduct(row, 'maxInterestRatePerPeriod'),

    interestRateFrequencyType: asEnumOption(row.interestRateFrequencyType),

    amortizationType: asEnumOption(row.amortizationType),

    interestType: asEnumOption(row.interestType),

    interestCalculationPeriodType: asEnumOption(row.interestCalculationPeriodType),

    transactionProcessingStrategyCode: stringFromTemplateOrProduct(
      row,
      'transactionProcessingStrategyCode'
    ),

    transactionProcessingStrategyName: stringFromTemplateOrProduct(
      row,
      'transactionProcessingStrategyName'
    ),

    allowAttributeOverrides:
      asLoanProductAttributeOverrides(row.allowAttributeOverrides) ??
      asLoanProductAttributeOverrides(loanTemplateProductRow(row)?.allowAttributeOverrides),

    linkedToFloatingInterestRates:
      row.isLoanProductLinkedToFloatingRate === true ||
      row.linkedToFloatingInterestRates === true ||
      loanTemplateProductRow(row)?.isLinkedToFloatingInterestRates === true ||
      loanTemplateProductRow(row)?.linkedToFloatingInterestRates === true,

    isLoanProductLinkedToFloatingRate:
      row.isLoanProductLinkedToFloatingRate === true ? true : undefined,

    minInterestRateDifferential: toNumberFromTemplateOrProduct(row, 'minDifferentialLendingRate'),

    maxInterestRateDifferential: toNumberFromTemplateOrProduct(row, 'maxDifferentialLendingRate'),

    defaultDifferentialLendingRate: toNumberFromTemplateOrProduct(
      row,
      'defaultDifferentialLendingRate'
    ),

    multiDisburseLoan: row.multiDisburseLoan === true ? true : undefined,

    disallowExpectedDisbursements:
      row.disallowExpectedDisbursements === true ? true : undefined,

    maxTrancheCount: toNumber(row.maxTrancheCount),

    canUseForTopup: row.canUseForTopup === true ? true : undefined,

    canDefineInstallmentAmount:
      row.canDefineInstallmentAmount === true ? true : undefined,

    isInterestRecalculationEnabled:
      row.isInterestRecalculationEnabled === true ? true : undefined,

    loanScheduleType: asEnumOption(row.loanScheduleType),

    enableDownPayment: row.enableDownPayment === true ? true : undefined,

    product:

      row.product && typeof row.product === 'object'

        ? {

            id:
              toNumber((row.product as Record<string, unknown>).id) ??
              toNumber(row.loanProductId),

            name:

              typeof (row.product as Record<string, unknown>).name === 'string'

                ? ((row.product as Record<string, unknown>).name as string)

                : typeof row.loanProductName === 'string'

                  ? row.loanProductName

                  : undefined

          }

        : toNumber(row.loanProductId) != null

          ? {

              id: toNumber(row.loanProductId),

              name:

                typeof row.loanProductName === 'string' ? row.loanProductName : undefined

            }

          : undefined,

    chargeOptions: asLoanAccountChargeOptions(row.chargeOptions),

    charges: asLoanAccountChargeOptions(row.charges),

    overdueCharges: asLoanAccountChargeOptions(row.overdueCharges)

  };

}



export function normalizeLoanCollateralTemplate(raw: unknown): ClientLoanAccountTemplate {

  if (!raw || typeof raw !== 'object') {

    return {};

  }

  const row = raw as Record<string, unknown>;

  return {

    loanCollateralOptions: asLoanCollateralOptions(row.loanCollateralOptions)

  };

}


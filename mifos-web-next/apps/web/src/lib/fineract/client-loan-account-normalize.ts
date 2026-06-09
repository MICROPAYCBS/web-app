/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type {

  ClientLoanAccountTemplate,

  FineractEnumOption

} from '@mifos/api-client';



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

        description: typeof row.description === 'string' ? row.description : undefined

      };

    })

    .filter((item): item is NonNullable<typeof item> => item !== null);

}



export function normalizeClientLoanAccountTemplate(raw: unknown): ClientLoanAccountTemplate {

  if (!raw || typeof raw !== 'object') {

    return {};

  }

  const row = raw as Record<string, unknown>;

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

    loanTermFrequency: toNumber(row.loanTermFrequency),

    loanTermFrequencyType: asEnumOption(row.loanTermFrequencyType),

    numberOfRepayments: toNumber(row.numberOfRepayments),

    repaymentEvery: toNumber(row.repaymentEvery),

    repaymentFrequencyType: asEnumOption(row.repaymentFrequencyType),

    interestRatePerPeriod: toNumber(row.interestRatePerPeriod),

    amortizationType: asEnumOption(row.amortizationType),

    interestType: asEnumOption(row.interestType),

    interestCalculationPeriodType: asEnumOption(row.interestCalculationPeriodType),

    transactionProcessingStrategyCode:

      typeof row.transactionProcessingStrategyCode === 'string'

        ? row.transactionProcessingStrategyCode

        : undefined,

    product:

      row.product && typeof row.product === 'object'

        ? {

            id: toNumber((row.product as Record<string, unknown>).id),

            name:

              typeof (row.product as Record<string, unknown>).name === 'string'

                ? ((row.product as Record<string, unknown>).name as string)

                : undefined

          }

        : undefined

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


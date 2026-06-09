/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { CreateLoanAccountInput, LoanGuarantorItemInput } from '@mifos/validation';

import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';



function stripEmpty(payload: Record<string, unknown>): Record<string, unknown> {

  for (const key of Object.keys(payload)) {

    if (payload[key] === '' || payload[key] === undefined) {

      delete payload[key];

    }

  }

  return payload;

}



export function buildLoanAccountPayload(

  clientId: string | number,

  input: CreateLoanAccountInput

): Record<string, unknown> {

  const collateral =

    input.collateral && input.collateral.length > 0

      ? input.collateral.map((item) => ({

          clientCollateralId: item.collateralTypeId,

          quantity: item.value

        }))

      : undefined;



  return stripEmpty({

    clientId: Number(clientId),

    productId: input.productId,

    principal: input.principal,

    loanTermFrequency: input.loanTermFrequency,

    loanTermFrequencyType: input.loanTermFrequencyType,

    loanType: input.loanType ?? 'individual',

    numberOfRepayments: input.numberOfRepayments,

    repaymentEvery: input.repaymentEvery,

    repaymentFrequencyType: input.repaymentFrequencyType,

    interestRatePerPeriod: input.interestRatePerPeriod,

    amortizationType: input.amortizationType,

    interestType: input.interestType,

    interestCalculationPeriodType: input.interestCalculationPeriodType,

    transactionProcessingStrategyCode: input.transactionProcessingStrategyCode,

    expectedDisbursementDate: input.expectedDisbursementDate,

    submittedOnDate: input.submittedOnDate,

    graceOnPrincipalPayment: input.graceOnPrincipalPayment,

    graceOnInterestPayment: input.graceOnInterestPayment,

    graceOnInterestCharged: input.graceOnInterestCharged,

    loanOfficerId: input.loanOfficerId,

    loanPurposeId: input.loanPurposeId,

    fundId: input.fundId,

    externalId: input.externalId,

    linkAccountId: input.linkAccountId,

    disburseToSavings: input.disburseToSavings,

    collateral,

    locale: FINERACT_LOCALE,

    dateFormat: FINERACT_DATE_FORMAT

  });

}



export function buildLoanGuarantorPayload(

  guarantor: LoanGuarantorItemInput

): Record<string, unknown> {

  return stripEmpty({

    guarantorTypeId: guarantor.guarantorTypeId,

    entityId: guarantor.entityId,

    firstname: guarantor.firstname,

    lastname: guarantor.lastname,

    locale: FINERACT_LOCALE,

    dateFormat: FINERACT_DATE_FORMAT

  });

}


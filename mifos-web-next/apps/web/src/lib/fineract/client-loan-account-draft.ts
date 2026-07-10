/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ClientLoanAccountTemplate } from '@mifos/api-client';

import type {

  CreateLoanAccountInput,

  LoanAccountCoreStepInput,

  LoanAccountFinancialStepInput,

  LoanAccountPayoutStepInput,

  LoanAccountChargesStepInput,

  LoanAccountSecurityStepInput,

  LoanAccountTimelineStepInput

} from '@mifos/validation';

import { toFineractDate } from '@/lib/fineract/dates';
import { defaultLoanAccountChargesFromTemplate } from '@/lib/fineract/loan-application-charges';



export type LoanAccountDraft = CreateLoanAccountInput;



export function emptyLoanAccountDraft(): LoanAccountDraft {

  const today = toFineractDate();

  return {

    productId: 0,

    loanOfficerId: 0,

    submittedOnDate: today,

    expectedDisbursementDate: today,

    externalId: '',

    principal: 0,

    loanTermFrequency: 0,

    loanTermFrequencyType: 0,

    loanType: 'individual',

    numberOfRepayments: 0,

    repaymentEvery: 0,

    repaymentFrequencyType: 0,

    interestRatePerPeriod: 0,

    interestRateDifferential: undefined,

    isFloatingInterestRate: undefined,

    graceOnPrincipalPayment: 0,

    graceOnInterestPayment: 0,

    graceOnInterestCharged: 0,

    amortizationType: 0,

    interestType: 0,

    interestCalculationPeriodType: 0,

    transactionProcessingStrategyCode: '',

    charges: [],

    collateral: [],

    guarantors: [],

    createStandingInstructionAtDisbursement: false

  };

}



export function loanAccountDraftFromTemplate(

  template: ClientLoanAccountTemplate

): LoanAccountDraft {

  const base = emptyLoanAccountDraft();

  const loanTermFrequencyTypeId =
    template.loanTermFrequencyType?.id ?? base.loanTermFrequencyType;

  const repaymentFrequencyTypeId =
    template.repaymentFrequencyType?.id ?? loanTermFrequencyTypeId;

  return {

    ...base,

    productId: template.product?.id ?? 0,

    principal: template.principal ?? base.principal,

    loanTermFrequency: template.loanTermFrequency ?? base.loanTermFrequency,

    loanTermFrequencyType: loanTermFrequencyTypeId,

    numberOfRepayments: template.numberOfRepayments ?? base.numberOfRepayments,

    repaymentEvery: template.repaymentEvery ?? base.repaymentEvery,

    repaymentFrequencyType: repaymentFrequencyTypeId,

    interestRatePerPeriod:

      template.interestRatePerPeriod ?? base.interestRatePerPeriod,

    interestRateDifferential:

      template.defaultDifferentialLendingRate ?? base.interestRateDifferential,

    isFloatingInterestRate:

      template.linkedToFloatingInterestRates === true ||
      template.isLoanProductLinkedToFloatingRate === true
        ? true
        : base.isFloatingInterestRate,

    amortizationType: template.amortizationType?.id ?? base.amortizationType,

    interestType:
      template.linkedToFloatingInterestRates === true ||
      template.isLoanProductLinkedToFloatingRate === true
        ? 0
        : template.interestType?.id ?? base.interestType,

    interestCalculationPeriodType:

      template.interestCalculationPeriodType?.id ?? base.interestCalculationPeriodType,

    transactionProcessingStrategyCode:

      template.transactionProcessingStrategyCode ??

      template.transactionProcessingStrategyOptions?.[0]?.code ??

      base.transactionProcessingStrategyCode,

    charges: defaultLoanAccountChargesFromTemplate(template.charges),

    enableDownPayment:
      template.enableDownPayment === true ? true : undefined

  };

}



export function mergeLoanAccountCoreStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountCoreStepInput>

): LoanAccountDraft {

  return {

    ...draft,

    ...patch,

    productId: patch.productId ?? draft.productId,

    loanOfficerId: patch.loanOfficerId ?? draft.loanOfficerId,

    loanPurposeId: patch.loanPurposeId ?? draft.loanPurposeId,

    fundId: patch.fundId ?? draft.fundId

  };

}



export function mergeLoanAccountFinancialStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountFinancialStepInput>

): LoanAccountDraft {

  return { ...draft, ...patch };

}



export function mergeLoanAccountTimelineStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountTimelineStepInput>

): LoanAccountDraft {

  return { ...draft, ...patch };

}



export function mergeLoanAccountChargesStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountChargesStepInput>

): LoanAccountDraft {

  return { ...draft, ...patch };

}



export function mergeLoanAccountSecurityStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountSecurityStepInput>

): LoanAccountDraft {

  return { ...draft, ...patch };

}



export function mergeLoanAccountPayoutStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountPayoutStepInput>

): LoanAccountDraft {

  return {

    ...draft,

    ...patch,

    linkAccountId: patch.linkAccountId ?? draft.linkAccountId

  };

}



/** @deprecated Use mergeLoanAccountCoreStep */

export function mergeLoanAccountProductStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountCoreStepInput>

): LoanAccountDraft {

  return mergeLoanAccountCoreStep(draft, patch);

}



/** @deprecated Use mergeLoanAccountFinancialStep + mergeLoanAccountTimelineStep */

export function mergeLoanAccountTermsStep(

  draft: LoanAccountDraft,

  patch: Partial<LoanAccountFinancialStepInput & LoanAccountTimelineStepInput>

): LoanAccountDraft {

  return { ...draft, ...patch };

}


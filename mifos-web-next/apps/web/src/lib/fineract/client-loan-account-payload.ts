/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateLoanAccountInput, LoanGuarantorItemInput } from '@mifos/validation';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { uniqueLoanAccountCharges } from '@/lib/fineract/loan-application-charges';

export interface BuildLoanAccountPayloadOptions {
  clientId: string | number;
  /** When true, omit interestRatePerPeriod and send floating fields instead. */
  linkedToFloatingInterestRates?: boolean;
  /** When true, omit fields not accepted by POST /loans?command=calculateLoanSchedule. */
  forSchedulePreview?: boolean;
}

/** Fields accepted on loan create but rejected by calculateLoanSchedule. */
const SCHEDULE_PREVIEW_OMIT_FIELDS = [
  'linkAccountId',
  'externalId',
  'createStandingInstructionAtDisbursement'
] as const;

function stripEmpty(payload: Record<string, unknown>): Record<string, unknown> {
  for (const key of Object.keys(payload)) {
    if (payload[key] === '' || payload[key] === undefined) {
      delete payload[key];
    }
  }
  return payload;
}

export function buildLoanAccountPayload(
  input: CreateLoanAccountInput,
  options: BuildLoanAccountPayloadOptions
): Record<string, unknown> {
  const collateral =
    input.collateral && input.collateral.length > 0
      ? input.collateral.map((item) => ({
          clientCollateralId: item.collateralTypeId,
          quantity: item.value
        }))
      : undefined;

  const floating = options.linkedToFloatingInterestRates === true;

  const charges =
    input.charges && input.charges.length > 0
      ? uniqueLoanAccountCharges(input.charges).map((charge) =>
          stripEmpty({
            chargeId: charge.chargeId,
            amount: charge.amount,
            dueDate: charge.dueDate,
            feeInterval: charge.feeInterval,
            feeOnMonthDay: charge.feeOnMonthDay
          })
        )
      : undefined;

  const payload: Record<string, unknown> = {
    clientId: Number(options.clientId),
    productId: input.productId,
    principal: input.principal,
    loanTermFrequency: input.loanTermFrequency,
    loanTermFrequencyType: input.loanTermFrequencyType,
    loanType: input.loanType ?? 'individual',
    numberOfRepayments: input.numberOfRepayments,
    repaymentEvery: input.repaymentEvery,
    repaymentFrequencyType: input.repaymentFrequencyType,
    amortizationType: input.amortizationType,
    interestType: floating ? 0 : input.interestType,
    interestCalculationPeriodType: input.interestCalculationPeriodType,
    transactionProcessingStrategyCode: input.transactionProcessingStrategyCode,
    expectedDisbursementDate: input.expectedDisbursementDate,
    repaymentsStartingFromDate: input.repaymentsStartingFromDate,
    submittedOnDate: input.submittedOnDate,
    graceOnPrincipalPayment: input.graceOnPrincipalPayment,
    graceOnInterestPayment: input.graceOnInterestPayment,
    graceOnInterestCharged: input.graceOnInterestCharged,
    loanOfficerId: input.loanOfficerId,
    loanPurposeId: input.loanPurposeId,
    fundId: input.fundId,
    externalId: input.externalId,
    linkAccountId: input.linkAccountId,
    createStandingInstructionAtDisbursement: input.createStandingInstructionAtDisbursement,
    collateral,
    charges,
    locale: FINERACT_LOCALE,
    dateFormat: FINERACT_DATE_FORMAT
  };

  if (floating) {
    payload.isFloatingInterestRate = input.isFloatingInterestRate ?? true;
    payload.interestRateDifferential = input.interestRateDifferential;
  } else {
    payload.interestRatePerPeriod = input.interestRatePerPeriod;
  }

  if (options.forSchedulePreview) {
    for (const key of SCHEDULE_PREVIEW_OMIT_FIELDS) {
      delete payload[key];
    }
  }

  return stripEmpty(payload);
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

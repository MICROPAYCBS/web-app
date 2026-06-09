/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import { z } from 'zod';



const optionalId = z.coerce

  .number()

  .int()

  .positive()

  .optional()

  .or(z.literal(''))

  .transform((v) => (v === '' ? undefined : v));



const fineractDate = z.string().trim().min(1);



export const loanCollateralItemSchema = z.object({

  collateralTypeId: z.coerce.number().int().positive('Select collateral.'),

  value: z.coerce.number().positive('Quantity is required.'),

  description: z.string().trim().max(500).optional().or(z.literal(''))

});



export const loanGuarantorItemSchema = z

  .object({

    guarantorTypeId: z.coerce.number().int().positive('Select guarantor type.'),

    entityId: optionalId,

    firstname: z.string().trim().max(100).optional().or(z.literal('')),

    lastname: z.string().trim().max(100).optional().or(z.literal(''))

  })

  .superRefine((value, ctx) => {

    if (value.guarantorTypeId === 4) {

      if (!value.firstname?.trim()) {

        ctx.addIssue({

          code: z.ZodIssueCode.custom,

          message: 'First name is required for external guarantors.',

          path: ['firstname']

        });

      }

      if (!value.lastname?.trim()) {

        ctx.addIssue({

          code: z.ZodIssueCode.custom,

          message: 'Last name is required for external guarantors.',

          path: ['lastname']

        });

      }

    } else if (value.guarantorTypeId === 1 || value.guarantorTypeId === 3) {

      if (value.entityId == null) {

        ctx.addIssue({

          code: z.ZodIssueCode.custom,

          message: 'Entity ID is required for this guarantor type.',

          path: ['entityId']

        });

      }

    }

  });



/** Step 1 — Core product & context */

export const loanAccountCoreStepSchema = z.object({

  productId: z.coerce.number().int().positive('Select a loan product.'),

  loanOfficerId: optionalId,

  loanPurposeId: optionalId,

  fundId: optionalId,

  externalId: z.string().trim().max(100).optional().or(z.literal(''))

});



/** Step 2 — Financial terms */

export const loanAccountFinancialStepSchema = z.object({

  principal: z.coerce.number().positive('Principal is required.'),

  loanTermFrequency: z.coerce.number().int().positive('Loan term is required.'),

  loanTermFrequencyType: z.coerce.number().int().min(0),

  numberOfRepayments: z.coerce.number().int().positive('Number of repayments is required.'),

  repaymentEvery: z.coerce.number().int().positive('Repayment frequency is required.'),

  repaymentFrequencyType: z.coerce.number().int().min(0)

});



/** Step 3 — Interest & timeline (includes product-derived Fineract fields) */

export const loanAccountTimelineStepSchema = z.object({

  interestRatePerPeriod: z.coerce.number().min(0, 'Interest rate is required.'),

  submittedOnDate: fineractDate,

  expectedDisbursementDate: fineractDate,

  graceOnPrincipalPayment: z.coerce.number().int().min(0).default(0),

  graceOnInterestPayment: z.coerce.number().int().min(0).default(0),

  graceOnInterestCharged: z.coerce.number().int().min(0).default(0),

  amortizationType: z.coerce.number().int().min(0),

  interestType: z.coerce.number().int().min(0),

  interestCalculationPeriodType: z.coerce.number().int().min(0),

  transactionProcessingStrategyCode: z.string().trim().min(1, 'Select a processing strategy.')

});



/** Step 4 — Collateral & guarantors (optional) */

export const loanAccountSecurityStepSchema = z.object({

  collateral: z.array(loanCollateralItemSchema).default([]),

  guarantors: z.array(loanGuarantorItemSchema).default([])

});



/** Step 5 — Payout & automation */

export const loanAccountPayoutStepSchema = z.object({

  linkAccountId: optionalId,

  disburseToSavings: z.boolean().default(false)

});



export const createLoanAccountSchema = loanAccountCoreStepSchema

  .merge(loanAccountFinancialStepSchema)

  .merge(loanAccountTimelineStepSchema)

  .merge(loanAccountSecurityStepSchema)

  .merge(loanAccountPayoutStepSchema)

  .extend({

    loanType: z.literal('individual').default('individual')

  });



/** @deprecated Use loanAccountCoreStepSchema */

export const loanAccountProductStepSchema = loanAccountCoreStepSchema;



/** @deprecated Use loanAccountFinancialStepSchema + loanAccountTimelineStepSchema */

export const loanAccountTermsStepSchema = loanAccountFinancialStepSchema.merge(

  loanAccountTimelineStepSchema.pick({

    interestRatePerPeriod: true,

    amortizationType: true,

    interestType: true,

    interestCalculationPeriodType: true,

    transactionProcessingStrategyCode: true

  })

);



export type LoanAccountCoreStepInput = z.infer<typeof loanAccountCoreStepSchema>;

export type LoanAccountFinancialStepInput = z.infer<typeof loanAccountFinancialStepSchema>;

export type LoanAccountTimelineStepInput = z.infer<typeof loanAccountTimelineStepSchema>;

export type LoanAccountSecurityStepInput = z.infer<typeof loanAccountSecurityStepSchema>;

export type LoanAccountPayoutStepInput = z.infer<typeof loanAccountPayoutStepSchema>;

export type LoanCollateralItemInput = z.infer<typeof loanCollateralItemSchema>;

export type LoanGuarantorItemInput = z.infer<typeof loanGuarantorItemSchema>;



/** @deprecated Use LoanAccountCoreStepInput */

export type LoanAccountProductStepInput = LoanAccountCoreStepInput;



/** @deprecated Use LoanAccountFinancialStepInput */

export type LoanAccountTermsStepInput = z.infer<typeof loanAccountTermsStepSchema>;



export type CreateLoanAccountInput = z.infer<typeof createLoanAccountSchema>;


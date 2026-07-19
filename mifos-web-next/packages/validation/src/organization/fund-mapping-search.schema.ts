/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

const loanStatusValue = z.enum(['all', 'active', 'closed', 'overpaid', 'writeoff']);
const loanDateOption = z.enum(['approvalDate', 'createdDate', 'disbursalDate']);
const comparisonCondition = z.enum(['between', '<=', '>=', '<', '>', '=']);
const optionalNumber = z.coerce.number().min(0).optional();
const optionalText = z.string().trim().optional().or(z.literal(''));

export const fundMappingSearchSchema = z
  .object({
    loanStatus: z.array(loanStatusValue).optional().default([]),
    loanProducts: z.array(z.coerce.number().int().positive()).optional().default([]),
    offices: z.array(z.coerce.number().int().positive()).optional().default([]),
    loanDateOption: loanDateOption,
    loanFromDate: z.string().trim().min(1, 'From date is required'),
    loanToDate: z.string().trim().min(1, 'To date is required'),
    includeOutStandingAmountPercentage: z.boolean(),
    outStandingAmountPercentageCondition: comparisonCondition.optional(),
    minOutStandingAmountPercentage: optionalNumber,
    maxOutStandingAmountPercentage: optionalNumber,
    outStandingAmountPercentage: optionalNumber,
    includeOutstandingAmount: z.boolean(),
    outstandingAmountCondition: comparisonCondition.optional(),
    minOutstandingAmount: optionalNumber,
    maxOutstandingAmount: optionalNumber,
    outstandingAmount: optionalNumber,
    locale: z.string().optional(),
    dateFormat: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.includeOutStandingAmountPercentage) {
      if (!value.outStandingAmountPercentageCondition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Comparison condition is required',
          path: ['outStandingAmountPercentageCondition']
        });
      } else if (value.outStandingAmountPercentageCondition === 'between') {
        if (value.minOutStandingAmountPercentage == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Minimum value is required',
            path: ['minOutStandingAmountPercentage']
          });
        }
        if (value.maxOutStandingAmountPercentage == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Maximum value is required',
            path: ['maxOutStandingAmountPercentage']
          });
        }
      } else if (value.outStandingAmountPercentage == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Comparison value is required',
          path: ['outStandingAmountPercentage']
        });
      }
    }

    if (value.includeOutstandingAmount) {
      if (!value.outstandingAmountCondition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Comparison condition is required',
          path: ['outstandingAmountCondition']
        });
      } else if (value.outstandingAmountCondition === 'between') {
        if (value.minOutstandingAmount == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Minimum value is required',
            path: ['minOutstandingAmount']
          });
        }
        if (value.maxOutstandingAmount == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Maximum value is required',
            path: ['maxOutstandingAmount']
          });
        }
      } else if (value.outstandingAmount == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Comparison value is required',
          path: ['outstandingAmount']
        });
      }
    }
  });

export type FundMappingSearchInput = z.input<typeof fundMappingSearchSchema>;
export type FundMappingSearchPayload = z.output<typeof fundMappingSearchSchema>;

export function validateFundMappingSearch(input: unknown) {
  return fundMappingSearchSchema.safeParse(input);
}

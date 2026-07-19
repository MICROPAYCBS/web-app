/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

export const accountingRuleSideTypeSchema = z.enum(['fixedAccount', 'listOfAccounts']);

export const upsertAccountingRuleFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.'),
    officeId: z.number().int().positive('Branch is required.'),
    debitRuleType: accountingRuleSideTypeSchema,
    accountToDebit: z.number().int().positive().optional(),
    debitTags: z.array(z.number().int().positive()).optional(),
    allowMultipleDebitEntries: z.boolean().optional(),
    creditRuleType: accountingRuleSideTypeSchema,
    accountToCredit: z.number().int().positive().optional(),
    creditTags: z.array(z.number().int().positive()).optional(),
    allowMultipleCreditEntries: z.boolean().optional(),
    description: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.debitRuleType === 'fixedAccount') {
      if (!data.accountToDebit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountToDebit'],
          message: 'Select an account to debit.'
        });
      }
    } else if (!data.debitTags?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['debitTags'],
        message: 'Select at least one debit tag.'
      });
    }

    if (data.creditRuleType === 'fixedAccount') {
      if (!data.accountToCredit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['accountToCredit'],
          message: 'Select an account to credit.'
        });
      }
    } else if (!data.creditTags?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['creditTags'],
        message: 'Select at least one credit tag.'
      });
    }
  });

export type AccountingRuleSideType = z.infer<typeof accountingRuleSideTypeSchema>;
export type UpsertAccountingRuleFormInput = z.infer<typeof upsertAccountingRuleFormSchema>;

export function validateUpsertAccountingRuleForm(input: unknown) {
  return upsertAccountingRuleFormSchema.safeParse(input);
}

export function buildUpsertAccountingRulePayload(input: UpsertAccountingRuleFormInput) {
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    officeId: input.officeId
  };

  const description = input.description?.trim();
  if (description) {
    payload.description = description;
  }

  if (input.debitRuleType === 'fixedAccount') {
    payload.accountToDebit = input.accountToDebit;
  } else {
    payload.debitTags = input.debitTags;
    payload.allowMultipleDebitEntries = input.allowMultipleDebitEntries ?? false;
  }

  if (input.creditRuleType === 'fixedAccount') {
    payload.accountToCredit = input.accountToCredit;
  } else {
    payload.creditTags = input.creditTags;
    payload.allowMultipleCreditEntries = input.allowMultipleCreditEntries ?? false;
  }

  return payload;
}

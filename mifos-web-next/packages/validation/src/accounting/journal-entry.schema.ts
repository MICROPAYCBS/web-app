/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  areJournalEntryTotalsBalanced,
  JOURNAL_ENTRY_UNBALANCED_MESSAGE
} from '@mifos/domain';
import { glAccountRequiresStatementTag } from './gl-account-governance';

const optionalPositiveInt = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  },
  z.number().int().positive().optional()
);

export const journalEntryLineSchema = z.object({
  glAccountId: z.number().int().positive('Select a GL account.'),
  amount: z.coerce.number().min(1, 'Amount must be at least 1.')
});

export const createJournalEntryFormBaseSchema = z.object({
  officeId: z.number().int().positive('Branch is required.'),
  departmentId: optionalPositiveInt,
  currencyCode: z.string().trim().min(1, 'Currency is required.'),
  transactionDate: z.string().trim().min(1, 'Transaction date is required.'),
  debits: z.array(journalEntryLineSchema).min(1, 'Add at least one debit line.'),
  credits: z.array(journalEntryLineSchema).min(1, 'Add at least one credit line.'),
  referenceNumber: z.string().optional(),
  paymentTypeId: z.number().int().positive().optional(),
  accountNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  routingCode: z.string().optional(),
  receiptNumber: z.string().optional(),
  bankNumber: z.string().optional(),
  comments: z.string().optional(),
  externalAssetOwner: z.string().optional(),
  accountingRule: optionalPositiveInt
});

export type CreateJournalEntryValidationContext = {
  requireDepartmentOnPlLines?: boolean;
  glAccountTypesById?: Record<number, number>;
};

function refineJournalEntryBalance(
  data: Pick<z.infer<typeof createJournalEntryFormBaseSchema>, 'debits' | 'credits'>,
  ctx: z.RefinementCtx
) {
  if (!areJournalEntryTotalsBalanced(data.debits, data.credits)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: JOURNAL_ENTRY_UNBALANCED_MESSAGE,
      path: ['balance']
    });
  }
}

function journalEntryHasPlAccount(
  data: Pick<z.infer<typeof createJournalEntryFormBaseSchema>, 'debits' | 'credits'>,
  glAccountTypesById: Record<number, number>
) {
  return [...data.debits, ...data.credits].some((line) => {
    const typeId = glAccountTypesById[line.glAccountId];
    return typeId != null && glAccountRequiresStatementTag(typeId);
  });
}

export function refineJournalEntryDepartments(
  data: Pick<
    z.infer<typeof createJournalEntryFormBaseSchema>,
    'debits' | 'credits' | 'departmentId'
  >,
  ctx: z.RefinementCtx,
  validationContext: CreateJournalEntryValidationContext = {}
) {
  if (!validationContext.requireDepartmentOnPlLines) {
    return;
  }
  const types = validationContext.glAccountTypesById ?? {};
  if (journalEntryHasPlAccount(data, types) && data.departmentId == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Department is required when posting to income or expense accounts.',
      path: ['departmentId']
    });
  }
}

export { refineJournalEntryBalance };

export const createJournalEntryFormSchema = createJournalEntryFormBaseSchema.superRefine(
  refineJournalEntryBalance
);

export const revertJournalEntrySchema = z.object({
  comments: z.string().optional()
});

export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;
export type CreateJournalEntryFormInput = z.infer<typeof createJournalEntryFormSchema>;
export type RevertJournalEntryInput = z.infer<typeof revertJournalEntrySchema>;

export function validateCreateJournalEntryForm(
  input: unknown,
  validationContext: CreateJournalEntryValidationContext = {}
) {
  return createJournalEntryFormBaseSchema
    .superRefine((data, ctx) => {
      refineJournalEntryBalance(data, ctx);
      refineJournalEntryDepartments(data, ctx, validationContext);
    })
    .safeParse(input);
}

export function validateRevertJournalEntry(input: unknown) {
  return revertJournalEntrySchema.safeParse(input);
}

export function buildCreateJournalEntryPayload(
  input: CreateJournalEntryFormInput,
  options: { locale: string; dateFormat: string }
) {
  return {
    locale: options.locale,
    dateFormat: options.dateFormat,
    officeId: input.officeId,
    currencyCode: input.currencyCode,
    transactionDate: input.transactionDate,
    debits: input.debits.map((line) => ({
      glAccountId: line.glAccountId,
      amount: line.amount,
      ...(input.departmentId != null ? { departmentId: input.departmentId } : {})
    })),
    credits: input.credits.map((line) => ({
      glAccountId: line.glAccountId,
      amount: line.amount,
      ...(input.departmentId != null ? { departmentId: input.departmentId } : {})
    })),
    referenceNumber: input.referenceNumber?.trim() || undefined,
    paymentTypeId: input.paymentTypeId,
    accountNumber: input.accountNumber?.trim() || undefined,
    checkNumber: input.checkNumber?.trim() || undefined,
    routingCode: input.routingCode?.trim() || undefined,
    receiptNumber: input.receiptNumber?.trim() || undefined,
    bankNumber: input.bankNumber?.trim() || undefined,
    comments: input.comments?.trim() || undefined,
    externalAssetOwner: input.externalAssetOwner?.trim() || undefined,
    ...(input.accountingRule != null ? { accountingRule: input.accountingRule } : {})
  };
}

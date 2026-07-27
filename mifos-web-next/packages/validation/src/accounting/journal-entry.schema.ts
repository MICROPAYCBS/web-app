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

/** Max length matches Fineract journal narration fields (≤ 500). */
export const JOURNAL_ENTRY_NARRATION_MAX_LENGTH = 500;

const optionalLineComments = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  },
  z
    .string()
    .trim()
    .max(
      JOURNAL_ENTRY_NARRATION_MAX_LENGTH,
      `Line narration must be at most ${JOURNAL_ENTRY_NARRATION_MAX_LENGTH} characters.`
    )
    .optional()
);

export const journalEntryLineSchema = z.object({
  glAccountId: z.number().int().positive('Select a GL account.'),
  amount: z.coerce.number().min(1, 'Amount must be at least 1.'),
  departmentId: optionalPositiveInt,
  comments: optionalLineComments
});

export const createJournalEntryFormBaseSchema = z.object({
  debitOfficeId: z.number().int().positive('Debit branch is required.'),
  debitDepartmentId: optionalPositiveInt,
  creditOfficeId: z.number().int().positive('Credit branch is required.'),
  creditDepartmentId: optionalPositiveInt,
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
  /** Shared transaction memo — maps to Fineract create top-level `comments` → `transactionComments`. */
  comments: z
    .string()
    .trim()
    .min(1, 'Transaction narration is required.')
    .max(
      JOURNAL_ENTRY_NARRATION_MAX_LENGTH,
      `Transaction narration must be at most ${JOURNAL_ENTRY_NARRATION_MAX_LENGTH} characters.`
    ),
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

function journalSidePlLinesMissingDepartment(
  lines: z.infer<typeof journalEntryLineSchema>[],
  sideDepartmentId: number | undefined,
  glAccountTypesById: Record<number, number>
) {
  return lines.some((line) => {
    const typeId = glAccountTypesById[line.glAccountId];
    if (typeId == null || !glAccountRequiresStatementTag(typeId)) {
      return false;
    }
    return line.departmentId == null && sideDepartmentId == null;
  });
}

export function refineJournalEntryDepartments(
  data: Pick<
    z.infer<typeof createJournalEntryFormBaseSchema>,
    'debits' | 'credits' | 'debitDepartmentId' | 'creditDepartmentId'
  >,
  ctx: z.RefinementCtx,
  validationContext: CreateJournalEntryValidationContext = {}
) {
  if (!validationContext.requireDepartmentOnPlLines) {
    return;
  }
  const types = validationContext.glAccountTypesById ?? {};
  if (journalSidePlLinesMissingDepartment(data.debits, data.debitDepartmentId, types)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Department is required when posting debits to income or expense accounts.',
      path: ['debitDepartmentId']
    });
  }
  if (journalSidePlLinesMissingDepartment(data.credits, data.creditDepartmentId, types)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Department is required when posting credits to income or expense accounts.',
      path: ['creditDepartmentId']
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

const narrationStringSchema = z
  .string({ required_error: 'Narration is required.' })
  .max(
    JOURNAL_ENTRY_NARRATION_MAX_LENGTH,
    `Narration must be at most ${JOURNAL_ENTRY_NARRATION_MAX_LENGTH} characters.`
  );

export const updateJournalEntryNarrationSchema = z.object({
  transactionComments: narrationStringSchema
});

export const updateJournalEntryLineNarrationSchema = z.object({
  comments: narrationStringSchema
});

export const updateJournalEntryLineNarrationsSchema = z.object({
  entries: z
    .array(
      z.object({
        id: z.number().int().positive('Entry id is required.'),
        comments: narrationStringSchema
      })
    )
    .min(1, 'Add at least one line narration.')
});

export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;
export type CreateJournalEntryFormInput = z.infer<typeof createJournalEntryFormSchema>;
export type RevertJournalEntryInput = z.infer<typeof revertJournalEntrySchema>;
export type UpdateJournalEntryNarrationInput = z.infer<typeof updateJournalEntryNarrationSchema>;
export type UpdateJournalEntryLineNarrationInput = z.infer<
  typeof updateJournalEntryLineNarrationSchema
>;
export type UpdateJournalEntryLineNarrationsInput = z.infer<
  typeof updateJournalEntryLineNarrationsSchema
>;

export function isSameOfficeJournalEntry(
  input: Pick<CreateJournalEntryFormInput, 'debitOfficeId' | 'creditOfficeId'>
) {
  return input.debitOfficeId === input.creditOfficeId;
}

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

export function validateUpdateJournalEntryNarration(input: unknown) {
  return updateJournalEntryNarrationSchema.safeParse(input);
}

export function validateUpdateJournalEntryLineNarration(input: unknown) {
  return updateJournalEntryLineNarrationSchema.safeParse(input);
}

export function validateUpdateJournalEntryLineNarrations(input: unknown) {
  return updateJournalEntryLineNarrationsSchema.safeParse(input);
}

export function buildUpdateJournalEntryNarrationPayload(input: UpdateJournalEntryNarrationInput) {
  return { transactionComments: input.transactionComments };
}

export function buildUpdateJournalEntryLineNarrationPayload(
  input: UpdateJournalEntryLineNarrationInput
) {
  return { comments: input.comments };
}

export function buildUpdateJournalEntryLineNarrationsPayload(
  input: UpdateJournalEntryLineNarrationsInput
) {
  return {
    entries: input.entries.map((entry) => ({
      id: entry.id,
      comments: entry.comments
    }))
  };
}

function mapJournalEntryLinePayload(
  line: JournalEntryLineInput,
  sideDepartmentId: number | undefined
) {
  return {
    glAccountId: line.glAccountId,
    amount: line.amount,
    ...(line.departmentId != null
      ? { departmentId: line.departmentId }
      : sideDepartmentId != null
        ? { departmentId: sideDepartmentId }
        : {}),
    ...(line.comments?.trim() ? { comments: line.comments.trim() } : {})
  };
}

export function buildCreateJournalEntryPayload(
  input: CreateJournalEntryFormInput,
  options: { locale: string; dateFormat: string }
) {
  if (!isSameOfficeJournalEntry(input)) {
    throw new Error('Cannot build a single journal entry payload for inter-branch offices.');
  }

  return {
    locale: options.locale,
    dateFormat: options.dateFormat,
    officeId: input.debitOfficeId,
    currencyCode: input.currencyCode,
    transactionDate: input.transactionDate,
    debits: input.debits.map((line) => mapJournalEntryLinePayload(line, input.debitDepartmentId)),
    credits: input.credits.map((line) =>
      mapJournalEntryLinePayload(line, input.creditDepartmentId)
    ),
    referenceNumber: input.referenceNumber?.trim() || undefined,
    paymentTypeId: input.paymentTypeId,
    accountNumber: input.accountNumber?.trim() || undefined,
    checkNumber: input.checkNumber?.trim() || undefined,
    routingCode: input.routingCode?.trim() || undefined,
    receiptNumber: input.receiptNumber?.trim() || undefined,
    bankNumber: input.bankNumber?.trim() || undefined,
    comments: input.comments.trim(),
    externalAssetOwner: input.externalAssetOwner?.trim() || undefined,
    ...(input.accountingRule != null ? { accountingRule: input.accountingRule } : {})
  };
}

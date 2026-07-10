/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';
import {
  createJournalEntryFormBaseSchema,
  refineJournalEntryBalance,
  refineJournalEntryDepartments,
  type CreateJournalEntryFormInput,
  type CreateJournalEntryValidationContext
} from './journal-entry.schema';

export const BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS = 50;

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

export const bulkConstructVariationModeSchema = z.enum(['branch', 'department']);

export const bulkConstructJournalEntriesTemplateSchema = z.object({
  accountingRuleId: z.number().int().positive('Select a posting template.'),
  variationMode: bulkConstructVariationModeSchema,
  defaultOfficeId: z.number().int().positive('Branch is required.'),
  departmentId: optionalPositiveInt,
  currencyCode: z.string().trim().min(1, 'Currency is required.'),
  transactionDate: z.string().trim().min(1, 'Transaction date is required.'),
  referenceNumber: z.string().optional(),
  paymentTypeId: optionalPositiveInt,
  accountNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  routingCode: z.string().optional(),
  receiptNumber: z.string().optional(),
  bankNumber: z.string().optional(),
  comments: z.string().optional()
});

export const bulkConstructJournalEntryRowSchema = z.object({
  officeId: optionalPositiveInt,
  departmentId: optionalPositiveInt,
  amount: z.coerce.number().min(1, 'Amount must be at least 1.')
});

export const bulkConstructJournalEntriesFormSchema = z
  .object({
    template: bulkConstructJournalEntriesTemplateSchema,
    rows: z
      .array(bulkConstructJournalEntryRowSchema)
      .min(1, 'Add at least one variation row.')
      .max(
        BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS,
        `You can post up to ${BULK_CONSTRUCT_JOURNAL_ENTRIES_MAX_ROWS} entries at once. Use Excel import for larger batches.`
      )
  })
  .superRefine((data, ctx) => {
    const { template, rows } = data;
    if (template.variationMode === 'branch') {
      rows.forEach((row, index) => {
        if (row.officeId == null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Branch is required.',
            path: ['rows', index, 'officeId']
          });
        }
      });
      return;
    }

    rows.forEach((row, index) => {
      if (row.departmentId == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Department is required.',
          path: ['rows', index, 'departmentId']
        });
      }
    });
  });

export type BulkConstructVariationMode = z.infer<typeof bulkConstructVariationModeSchema>;
export type BulkConstructJournalEntriesTemplateInput = z.infer<
  typeof bulkConstructJournalEntriesTemplateSchema
>;
export type BulkConstructJournalEntryRowInput = z.infer<typeof bulkConstructJournalEntryRowSchema>;
export type BulkConstructJournalEntriesFormInput = z.infer<
  typeof bulkConstructJournalEntriesFormSchema
>;

export type BulkConstructExpandedEntry = {
  rowIndex: number;
  entry: CreateJournalEntryFormInput;
};

export type BulkConstructJournalEntriesValidationContext = CreateJournalEntryValidationContext & {
  expandEntry: (
    template: BulkConstructJournalEntriesTemplateInput,
    row: BulkConstructJournalEntryRowInput,
    rowIndex: number
  ) => CreateJournalEntryFormInput | null;
};

export function validateBulkConstructJournalEntriesForm(
  input: unknown,
  validationContext: BulkConstructJournalEntriesValidationContext
) {
  const parsed = bulkConstructJournalEntriesFormSchema.safeParse(input);
  if (!parsed.success) {
    return parsed;
  }

  const rowIssues: z.ZodIssue[] = [];
  for (let index = 0; index < parsed.data.rows.length; index += 1) {
    const row = parsed.data.rows[index];
    const entry = validationContext.expandEntry(parsed.data.template, row, index);
    if (!entry) {
      rowIssues.push({
        code: z.ZodIssueCode.custom,
        message: 'Unable to build journal entry for this row.',
        path: ['rows', index]
      });
      continue;
    }

    const entryParsed = createJournalEntryFormBaseSchema
      .superRefine((data, ctx) => {
        refineJournalEntryBalance(data, ctx);
        refineJournalEntryDepartments(data, ctx, validationContext);
      })
      .safeParse(entry);

    if (!entryParsed.success) {
      for (const issue of entryParsed.error.issues) {
        rowIssues.push({
          ...issue,
          path: ['rows', index, ...issue.path]
        });
      }
    }
  }

  if (rowIssues.length > 0) {
    return {
      success: false as const,
      error: new z.ZodError(rowIssues)
    };
  }

  return parsed;
}

export function expandBulkConstructJournalEntries(
  form: BulkConstructJournalEntriesFormInput,
  expandEntry: BulkConstructJournalEntriesValidationContext['expandEntry']
): BulkConstructExpandedEntry[] {
  return form.rows.flatMap((row, rowIndex) => {
    const entry = expandEntry(form.template, row, rowIndex);
    return entry ? [{ rowIndex, entry }] : [];
  });
}

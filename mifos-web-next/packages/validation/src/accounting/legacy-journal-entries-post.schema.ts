/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { z } from 'zod';

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

/** Max journal entries posted from one legacy import batch. */
export const LEGACY_JOURNAL_ENTRIES_POST_MAX_GROUPS = 200;

export const legacyJournalEntryPostLineSchema = z.object({
  side: z.enum(['DR', 'CR']),
  amount: z.number().positive('Amount must be greater than zero.'),
  glAccountId: z.number().int().positive(),
  departmentId: optionalPositiveInt
});

export const legacyJournalEntryPostGroupSchema = z.object({
  /** Spreadsheet group identity for UI result mapping. */
  groupKey: z.string().min(1),
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must be yyyy-MM-dd.'),
  reference: z.string(),
  officeId: z.number().int().positive(),
  comments: z.string().optional(),
  lines: z.array(legacyJournalEntryPostLineSchema).min(2, 'Each entry needs debit and credit lines.')
});

export const postLegacyJournalEntriesFormSchema = z.object({
  currencyCode: z.string().trim().min(1, 'Currency is required.'),
  groups: z
    .array(legacyJournalEntryPostGroupSchema)
    .min(1, 'Add at least one journal entry.')
    .max(
      LEGACY_JOURNAL_ENTRIES_POST_MAX_GROUPS,
      `Post at most ${LEGACY_JOURNAL_ENTRIES_POST_MAX_GROUPS} journal entries at a time.`
    )
});

export type LegacyJournalEntryPostLineInput = z.infer<typeof legacyJournalEntryPostLineSchema>;
export type LegacyJournalEntryPostGroupInput = z.infer<typeof legacyJournalEntryPostGroupSchema>;
export type PostLegacyJournalEntriesFormInput = z.infer<typeof postLegacyJournalEntriesFormSchema>;

export function validatePostLegacyJournalEntriesForm(input: unknown) {
  return postLegacyJournalEntriesFormSchema.safeParse(input);
}

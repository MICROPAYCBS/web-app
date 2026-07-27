/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CreateJournalEntryFormInput } from './journal-entry.schema';

export function isInterBranchJournalEntry(
  input: Pick<CreateJournalEntryFormInput, 'debitOfficeId' | 'creditOfficeId'>
) {
  return input.debitOfficeId !== input.creditOfficeId;
}

export function journalEntryLinesTotal(
  lines: CreateJournalEntryFormInput['debits']
): number {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

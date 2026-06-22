/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Fineract journal lookup id for a savings (or RD/FD) portfolio transaction. */
export function savingsJournalTransactionId(transactionId: string | number): string {
  return `S${transactionId}`;
}

/** Full-page journal entry transaction view in accounting. */
export function journalEntryTransactionPath(transactionId: string): string {
  return `/accounting/journal-entries/transactions/${encodeURIComponent(transactionId)}`;
}

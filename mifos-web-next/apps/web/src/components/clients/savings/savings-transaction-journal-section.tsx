'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import Link from 'next/link';
import { JournalEntryLinesTable } from '@/components/accounting/journal-entries/journal-entry-lines-table';
import { DetailSection } from '@/components/composites';
import { journalEntryTransactionPath } from '@/lib/accounting/journal-entry-links';

export function SavingsTransactionJournalSection({
  journalTransactionId,
  entries,
  loadFailed = false
}: {
  journalTransactionId: string;
  entries: FineractJournalEntryListItem[];
  loadFailed?: boolean;
}) {
  if (loadFailed) {
    return (
      <DetailSection title="Ledger entries">
        <p className="text-sm text-muted-foreground">
          Ledger entries could not be loaded for this transaction.
        </p>
      </DetailSection>
    );
  }

  if (entries.length === 0) {
    return (
      <DetailSection title="Ledger entries">
        <p className="text-sm text-muted-foreground">
          No ledger entries are linked to this transaction. This is normal when the savings
          product uses no accounting integration.
        </p>
      </DetailSection>
    );
  }

  return (
    <DetailSection
      title="Ledger entries"
      actions={
        <Link
          href={journalEntryTransactionPath(journalTransactionId)}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Open in accounting
        </Link>
      }
    >
      <JournalEntryLinesTable entries={entries} />
    </DetailSection>
  );
}

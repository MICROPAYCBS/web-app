'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { JournalEntryTransactionContent } from '@/components/accounting/journal-entries/journal-entry-transaction-content';
import { DetailBackLink, DetailHeader, DetailPage } from '@/components/composites';

export function JournalEntryTransactionView({
  transactionId,
  entries
}: {
  transactionId: string;
  entries: FineractJournalEntryListItem[];
}) {
  const summary = entries[0];

  if (!summary) {
    return (
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href="/accounting/journal-entries" label="Back to journal entries" />
            }
            title="Transaction not found"
            meta={transactionId}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          No journal entries were returned for this transaction.
        </p>
      </DetailPage>
    );
  }

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink href="/accounting/journal-entries" label="Back to journal entries" />
          }
          title={`Transaction ${transactionId}`}
          meta={summary.officeName}
        />
      }
    >
      <JournalEntryTransactionContent transactionId={transactionId} entries={entries} />
    </DetailPage>
  );
}

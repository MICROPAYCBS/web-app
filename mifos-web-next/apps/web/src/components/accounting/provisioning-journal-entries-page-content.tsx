'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractProvisioningJournalEntry } from '@mifos/api-client';
import { ProvisioningJournalEntriesTable } from '@/components/accounting/provisioning-journal-entries-table';
import { DetailBackLink, DetailHeader, DetailPage } from '@/components/composites';

export function ProvisioningJournalEntriesPageContent({
  entryId,
  entries
}: {
  entryId: number;
  entries: FineractProvisioningJournalEntry[];
}) {
  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href={`/accounting/provisioning-entries/${entryId}`}
              label="Back to provisioning entry"
            />
          }
          title="Provisioning journal entries"
          meta={`Journal entries posted for provisioning entry #${entryId}.`}
        />
      }
    >
      <ProvisioningJournalEntriesTable entries={entries} />
    </DetailPage>
  );
}

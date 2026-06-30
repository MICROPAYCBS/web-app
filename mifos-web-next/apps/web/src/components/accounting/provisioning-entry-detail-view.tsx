'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractProvisioningEntryDetail,
  FineractProvisioningEntryLineItem
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createProvisioningJournalEntriesAction } from '@/actions/provisioning-entries';
import { ProvisioningEntryEntriesTable } from '@/components/accounting/provisioning-entry-entries-table';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { Button } from '@/components/ui/button';
import { formatProvisioningAmount } from '@/lib/fineract/provisioning-entry-display';

export function ProvisioningEntryDetailView({
  entry,
  lines
}: {
  entry: FineractProvisioningEntryDetail;
  lines: FineractProvisioningEntryLineItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCreateJournalEntries() {
    startTransition(async () => {
      const result = await createProvisioningJournalEntriesAction(entry.id);
      if (!result.ok) {

        toast.error(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Journal entries created.', pending: 'Journal entries created sent for approval.' });
      if (result.resourceId != null) {
        router.push(`/accounting/provisioning-entries/${entry.id}/journal-entries`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={
            <DetailBackLink
              href="/accounting/provisioning-entries"
              label="Back to provisioning entries"
            />
          }
          title={`Provisioning entry #${entry.id}`}
          meta="Review calculated provisioning amounts by office, product, and category."
          actions={
            <div className="flex flex-wrap gap-2">
              <Can permission="CREATE_JOURNALENTRY">
                <Button
                  type="button"
                  size="sm"
                  disabled={entry.journalEntry || pending}
                  onClick={handleCreateJournalEntries}
                >
                  <Plus className="mr-2 size-4" />
                  Create journal entries
                </Button>
              </Can>
              {entry.journalEntry ? (
                <Link
                  href={`/accounting/provisioning-entries/${entry.id}/journal-entries`}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  View journal entries
                </Link>
              ) : null}
            </div>
          }
        />
      }
    >
      <div className="space-y-6">
        <DetailFieldGrid>
          <DetailField label="Created by">{entry.createdUser || '—'}</DetailField>
          <DetailField label="Created on">{entry.createdDate || '—'}</DetailField>
          <DetailField label="Amount to be reserved">
            {formatProvisioningAmount(entry.reservedAmount)}
          </DetailField>
          <DetailField label="Journal entries">
            {entry.journalEntry ? 'Created' : 'Not created'}
          </DetailField>
        </DetailFieldGrid>

        <ProvisioningEntryEntriesTable lines={lines} />
      </div>
    </DetailPage>
  );
}

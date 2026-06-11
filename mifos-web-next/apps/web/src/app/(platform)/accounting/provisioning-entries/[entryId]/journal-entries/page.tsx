/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ProvisioningJournalEntriesPageContent } from '@/components/accounting/provisioning-journal-entries-page-content';
import {
  getProvisioningEntry,
  getProvisioningJournalEntries
} from '@/lib/fineract/provisioning-entries';
import { getServerSession } from '@/lib/session/server';

export default async function ProvisioningJournalEntriesPage({
  params
}: {
  params: Promise<{ entryId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.provisioning'))) {
    notFound();
  }

  const { entryId: entryIdParam } = await params;
  const entryId = Number(entryIdParam);
  if (!Number.isFinite(entryId)) {
    notFound();
  }

  const [entry, journalPage] = await Promise.all([
    getProvisioningEntry(entryId),
    getProvisioningJournalEntries(entryId)
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <ProvisioningJournalEntriesPageContent entryId={entryId} entries={journalPage.pageItems} />
  );
}

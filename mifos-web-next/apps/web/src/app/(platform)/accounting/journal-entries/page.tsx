/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { JournalEntriesPageContent } from '@/components/accounting/journal-entries/journal-entries-page-content';
import { parseJournalEntryListQuery } from '@/lib/fineract/journal-entry-query';
import { listDepartments } from '@/lib/fineract/departments';
import { listJournalEntryGlAccounts, listJournalEntries } from '@/lib/fineract/journal-entries';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function JournalEntriesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.journal'))) {
    notFound();
  }

  const params = await searchParams;
  const query = parseJournalEntryListQuery(params);
  const [page, offices, glAccounts, departments] = await Promise.all([
    listJournalEntries(query),
    listOfficeOptions(),
    listJournalEntryGlAccounts(),
    listDepartments()
  ]);

  return (
    <JournalEntriesPageContent
      page={page}
      query={query}
      offices={offices}
      glAccounts={glAccounts}
      departments={departments}
    />
  );
}

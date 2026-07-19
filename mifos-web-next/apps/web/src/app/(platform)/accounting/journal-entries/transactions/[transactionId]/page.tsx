/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { JournalEntryTransactionView } from '@/components/accounting/journal-entries/journal-entry-transaction-view';
import { getJournalEntryTransaction } from '@/lib/fineract/journal-entries';
import { getServerSession } from '@/lib/session/server';

export default async function JournalEntryTransactionPage({
  params
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.journal'))) {
    notFound();
  }

  const { transactionId } = await params;
  if (!transactionId.trim()) {
    notFound();
  }

  const transaction = await getJournalEntryTransaction(transactionId);

  return (
    <JournalEntryTransactionView transactionId={transactionId} entries={transaction.pageItems} />
  );
}

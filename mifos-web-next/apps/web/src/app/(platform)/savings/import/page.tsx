/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SavingsTransactionsImportPanel } from '@/components/savings/savings-transactions-import-panel';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { getServerSession } from '@/lib/session/server';

export default async function SavingsTransactionsImportPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('savings.importTransactions'))) {
    notFound();
  }

  return (
    <ListPage
      title="Import savings transactions"
      description="Analyze an Excel file, then post deposits and withdrawals to savings accounts."
      backLink={<DetailBackLink href="/savings" label="Back to savings accounts" />}
    >
      <SavingsTransactionsImportPanel canPost />
    </ListPage>
  );
}

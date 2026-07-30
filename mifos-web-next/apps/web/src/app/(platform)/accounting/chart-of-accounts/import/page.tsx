/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ChartOfAccountsImportPanel } from '@/components/accounting/chart-of-accounts/chart-of-accounts-import-panel';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import {
  CHART_OF_ACCOUNTS_IMPORT_NAME,
  type ChartOfAccountsImportLookupAccount
} from '@/lib/accounting/chart-of-accounts-import';
import { getBulkImportDefinition } from '@/lib/fineract/bulk-import-config';
import { listGlAccounts } from '@/lib/fineract/gl-accounts';
import { getServerSession } from '@/lib/session/server';

export default async function ChartOfAccountsImportPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.coa'))) {
    notFound();
  }

  const definition = getBulkImportDefinition(CHART_OF_ACCOUNTS_IMPORT_NAME);
  if (!definition) {
    notFound();
  }

  const canDownload = can(session, definition.downloadPermission);
  const canCreate = can(session, 'CREATE_GLACCOUNT');

  const accounts = await listGlAccounts();

  const existingAccounts: ChartOfAccountsImportLookupAccount[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    glCode: account.glCode,
    usageValue: account.usage.value,
    typeValue: account.type.value
  }));

  return (
    <ListPage
      title="Import chart of accounts"
      description="Download the template, analyze your Excel file, then create accounts with live progress."
      backLink={
        <DetailBackLink href="/accounting/chart-of-accounts" label="Back to chart of accounts" />
      }
    >
      <ChartOfAccountsImportPanel
        existingAccounts={existingAccounts}
        canDownload={canDownload}
        canCreate={canCreate}
      />
    </ListPage>
  );
}

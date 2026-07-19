/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProvisioningEntryCreateUrlPanel } from '@/components/accounting/provisioning-entry-create-url-panel';
import { ProvisioningEntriesPageContent } from '@/components/accounting/provisioning-entries-page-content';
import { listProvisioningEntries } from '@/lib/fineract/provisioning-entries';
import { getServerSession } from '@/lib/session/server';

export default async function ProvisioningEntriesPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.provisioning'))) {
    notFound();
  }

  const { pageItems } = await listProvisioningEntries();

  return (
    <>
      <ProvisioningEntriesPageContent entries={pageItems} />
      {can(session, 'CREATE_PROVISIONING_ENTRIES') ? (
        <Suspense fallback={null}>
          <ProvisioningEntryCreateUrlPanel />
        </Suspense>
      ) : null}
    </>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractProvisioningEntryListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ProvisioningEntriesTable } from '@/components/accounting/provisioning-entries-table';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ProvisioningEntriesPageContent({
  entries
}: {
  entries: FineractProvisioningEntryListItem[];
}) {
  return (
    <ListPage
      title="Provisioning entries"
      description="Calculate and review loan loss provisioning for active loan products."
      actions={
        <Can permission="CREATE_PROVISIONING_ENTRIES">
          <Link
            href="/accounting/provisioning-entries?create=1"
            className={cn(buttonVariants())}
          >
            Create provisioning entry
          </Link>
        </Can>
      }
    >
      <ProvisioningEntriesTable entries={entries} />
    </ListPage>
  );
}

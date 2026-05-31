'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientTemplate, FineractClientsPage } from '@mifos/api-client';
import { Can, resolvePermission } from '@mifos/auth';
import { useState } from 'react';
import { CreateClientSheet } from '@/components/clients/create-client-sheet';
import { ClientsTable } from '@/components/clients/clients-table';
import { ListPage } from '@/components/composites/list-page';
import { Button } from '@/components/ui/button';

export function ClientsPageContent({
  initialPage,
  template,
  openCreate = false
}: {
  initialPage: FineractClientsPage;
  template: FineractClientTemplate | null;
  openCreate?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(openCreate);

  return (
    <>
      <ListPage
        title="Clients"
        description="Browse and manage clients from your Fineract instance."
        actions={
          <Can permission={resolvePermission('clients.create')}>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              New client
            </Button>
          </Can>
        }
      >
        <ClientsTable initialPage={initialPage} />
      </ListPage>

      <CreateClientSheet open={createOpen} onOpenChange={setCreateOpen} template={template} />
    </>
  );
}

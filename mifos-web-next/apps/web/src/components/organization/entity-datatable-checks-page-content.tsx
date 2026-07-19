'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractEntityDatatableCheck,
  FineractEntityDatatableCheckTemplate
} from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { useState } from 'react';
import { ListPage } from '@/components/composites/list-page';
import { EntityDatatableCheckFormSheet } from '@/components/organization/entity-datatable-check-form-sheet';
import { EntityDatatableChecksTable } from '@/components/organization/entity-datatable-checks-table';
import { Button } from '@/components/ui/button';

export function EntityDatatableChecksPageContent({
  checks,
  template
}: {
  checks: FineractEntityDatatableCheck[];
  template?: FineractEntityDatatableCheckTemplate | null;
}) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <ListPage
        title="Entity data table checks"
        description="Require custom data tables when customers, loans, groups, or savings accounts reach a given status."
        actions={
          template ? (
            <Can permission="CREATE_ENTITY_DATATABLE_CHECK">
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Create check
              </Button>
            </Can>
          ) : null
        }
      >
        <EntityDatatableChecksTable checks={checks} />
      </ListPage>

      {template ? (
        <EntityDatatableCheckFormSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          template={template}
        />
      ) : null}
    </>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import { Link2 } from 'lucide-react';
import { ClientManyToOneDatatableView } from '@/components/clients/detail/client-many-to-one-datatable-view';
import { EmptyState } from '@/components/composites';

export interface ClientRelationsTable {
  registeredTableName: string;
  columns: FineractDatatableColumnHeader[];
  rows: Record<string, unknown>[];
  canCreate: boolean;
  canDelete: boolean;
}

/** Legacy wrapper for pages that still pass multiple multi-row tables at once. */
export function ClientRelationsView({
  clientId,
  tables
}: {
  clientId: string;
  tables: ClientRelationsTable[];
}) {
  if (tables.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title="No related tables"
        description="No multi-row custom data tables are registered for this client type, or you do not have permission to view them."
      />
    );
  }

  return (
    <div className="space-y-6">
      {tables.map((table) => (
        <ClientManyToOneDatatableView
          key={table.registeredTableName}
          clientId={clientId}
          registeredTableName={table.registeredTableName}
          columns={table.columns}
          rows={table.rows}
          canCreate={table.canCreate}
          canDelete={table.canDelete}
        />
      ))}
    </div>
  );
}

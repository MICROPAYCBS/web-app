'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractExternalServiceProperty } from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import {
  type ExternalServiceDefinition,
  formatExternalServicePropertyValue,
  externalServicePropertyLabel,
  orderedExternalServiceProperties
} from '@/lib/fineract/external-service-display';

export function ExternalServiceConfigTable({
  definition,
  properties
}: {
  definition: ExternalServiceDefinition;
  properties: FineractExternalServiceProperty[];
}) {
  const rows = useMemo(
    () => orderedExternalServiceProperties(definition, properties),
    [definition, properties]
  );

  const columns = useMemo<ColumnDef<FineractExternalServiceProperty>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => externalServicePropertyLabel(definition, row.original.name)
      },
      {
        id: 'value',
        header: 'Value',
        accessorKey: 'value',
        cell: ({ row }) => formatExternalServicePropertyValue(definition, row.original)
      }
    ],
    [definition]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DataTable
      table={table}
      emptyMessage="No configuration"
      emptyDescription="This service has no stored configuration values yet."
    />
  );
}

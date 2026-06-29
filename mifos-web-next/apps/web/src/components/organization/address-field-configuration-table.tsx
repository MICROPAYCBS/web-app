'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFieldConfiguration } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import {
  addressFieldConfigurationLabel,
  addressSubentityLabel
} from '@/lib/fineract/address-field-configuration-display';

function BooleanIcon({ value, label }: { value: boolean; label: string }) {
  return value ? (
    <CheckCircle2 className="mx-auto size-4 text-primary" aria-label={`${label}: Yes`} />
  ) : (
    <XCircle className="mx-auto size-4 text-muted-foreground" aria-label={`${label}: No`} />
  );
}

export function AddressFieldConfigurationTable({
  rows
}: {
  rows: FineractFieldConfiguration[];
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((row) =>
      [
        row.field,
        addressFieldConfigurationLabel(row.field),
        row.subentity,
        addressSubentityLabel(row.subentity),
        row.validationRegex
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, filter]);

  const columns = useMemo<ColumnDef<FineractFieldConfiguration>[]>(
    () => [
      {
        accessorKey: 'field',
        header: 'Field key',
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.field}</span>
      },
      {
        id: 'label',
        header: 'Label',
        cell: ({ row }) => addressFieldConfigurationLabel(row.original.field)
      },
      {
        accessorKey: 'subentity',
        header: 'Applies to',
        cell: ({ row }) => addressSubentityLabel(row.original.subentity)
      },
      {
        accessorKey: 'isEnabled',
        header: 'Enabled',
        cell: ({ row }) => <BooleanIcon value={row.original.isEnabled} label="Enabled" />
      },
      {
        accessorKey: 'isMandatory',
        header: 'Required',
        cell: ({ row }) => <BooleanIcon value={row.original.isMandatory} label="Required" />
      },
      {
        accessorKey: 'validationRegex',
        header: 'Validation regex',
        cell: ({ row }) =>
          row.original.validationRegex ? (
            <span className="font-mono text-xs">{row.original.validationRegex}</span>
          ) : (
            '—'
          )
      }
    ],
    []
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <>
      <div className="mb-4">
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter address fields…"
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} emptyMessage="No address field configuration found" />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </>
  );
}

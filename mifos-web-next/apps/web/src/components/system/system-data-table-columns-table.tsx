'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { getDatatableCodeName, toDatatableDisplayLabel } from '@/lib/fineract/datatables';
import { filterUserDatatableColumns } from '@/lib/fineract/system-datatable-form';

function BoolCell({ value }: { value?: boolean }) {
  if (value) {
    return <Check className="size-4 text-primary" aria-label="Yes" />;
  }
  return <X className="size-4 text-muted-foreground" aria-label="No" />;
}

const columns: ColumnDef<FineractDatatableColumnHeader>[] = [
  {
    id: 'fieldName',
    header: 'Field name',
    cell: ({ row }) => {
      const codeName = getDatatableCodeName(row.original.columnName);
      return (
        <div className="space-y-0.5">
          <div>{toDatatableDisplayLabel(row.original.columnName)}</div>
          {codeName ? <div className="text-xs text-muted-foreground">({codeName})</div> : null}
        </div>
      );
    }
  },
  {
    accessorKey: 'columnDisplayType',
    header: 'Type',
    cell: ({ row }) => row.original.columnDisplayType ?? '—'
  },
  {
    id: 'columnLength',
    header: 'Length',
    cell: ({ row }) => row.original.columnLength ?? '—'
  },
  {
    id: 'columnCode',
    header: 'Code',
    cell: ({ row }) => row.original.columnCode?.trim() || '—'
  },
  {
    id: 'mandatory',
    header: 'Mandatory',
    cell: ({ row }) => <BoolCell value={row.original.isColumnNullable === false} />
  },
  {
    id: 'unique',
    header: 'Unique',
    cell: ({ row }) => <BoolCell value={row.original.isColumnUnique} />
  },
  {
    id: 'indexed',
    header: 'Indexed',
    cell: ({ row }) => <BoolCell value={row.original.isColumnIndexed} />
  }
];

export function SystemDataTableColumnsTable({
  columns: columnHeaders
}: {
  columns: FineractDatatableColumnHeader[];
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const userColumns = useMemo(() => filterUserDatatableColumns(columnHeaders), [columnHeaders]);

  const table = useReactTable({
    data: userColumns,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No columns defined"
        emptyDescription="This data table has no column definitions yet."
      />
      <DataTablePagination table={table} totalRecords={userColumns.length} />
    </div>
  );
}

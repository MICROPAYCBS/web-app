'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlAccountEnquiryRow } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { buildGlAccountEnquiryDetailsUrl } from '@/lib/fineract/gl-account-enquiry-query';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import { cn } from '@/lib/utils';

export function AdvancedGlAccountEnquiryTable({
  rows,
  pending = false,
  returnTo
}: {
  rows: FineractGlAccountEnquiryRow[];
  pending?: boolean;
  /** Current enquiry list URL so detail can link back. */
  returnTo: string;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const columns = useMemo<ColumnDef<FineractGlAccountEnquiryRow>[]>(
    () => [
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName
      },
      {
        id: 'departmentName',
        header: 'Department',
        cell: ({ row }) => row.original.departmentName?.trim() || ''
      },
      {
        accessorKey: 'glCode',
        header: 'GL Code',
        cell: ({ row }) => row.original.glCode
      },
      {
        accessorKey: 'glAccountName',
        header: 'GL Account Description',
        cell: ({ row }) => row.original.glAccountName
      },
      {
        accessorKey: 'currencyCode',
        header: 'Currency',
        cell: ({ row }) => row.original.currencyCode
      },
      {
        id: 'balance',
        header: 'Balance',
        cell: ({ row }) =>
          formatAccountMoney(row.original.balance, row.original.currencyCode)
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.disabled ? (
            <Badge variant="secondary">Disabled</Badge>
          ) : (
            <Badge variant="default">Enabled</Badge>
          )
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) => (
          <Link
            href={buildGlAccountEnquiryDetailsUrl(
              row.original.glAccountId,
              {
                officeId: String(row.original.officeId),
                currencyCode: row.original.currencyCode,
                ...(row.original.departmentId > 0
                  ? { departmentId: String(row.original.departmentId) }
                  : {})
              },
              { returnTo }
            )}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            aria-label={`View details for ${row.original.glCode}`}
          >
            <FileText className="mr-1.5 size-4" />
            View details
          </Link>
        )
      }
    ],
    [returnTo]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-4" aria-busy={pending || undefined}>
      <DataTable table={table} emptyMessage="No accounts matched these filters." />
      <DataTablePagination table={table} totalRecords={rows.length} />
    </div>
  );
}

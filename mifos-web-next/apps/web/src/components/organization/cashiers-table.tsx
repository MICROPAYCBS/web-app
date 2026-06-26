'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatFineractDateArray } from '@/lib/fineract/dates';
import { formatYesNo } from '@/lib/fineract/client-detail-labels';
import { tellerCashierDetailPath } from '@/lib/fineract/teller-paths';
import { cn } from '@/lib/utils';

function formatCashierPeriod(cashier: OrganizationCashierListItem): string {
  const start = formatFineractDateArray(cashier.startDate) ?? '—';
  const end = formatFineractDateArray(cashier.endDate) ?? '—';
  return `${start} – ${end}`;
}

export function CashiersTable({
  tellerId,
  cashiers,
  canUpdate,
  canDelete,
  onEdit,
  onDelete
}: {
  tellerId: string | number;
  cashiers: OrganizationCashierListItem[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (cashier: OrganizationCashierListItem) => void;
  onDelete: (cashier: OrganizationCashierListItem) => void;
}) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return cashiers;
    }
    return cashiers.filter((row) => {
      const haystack = [row.staffName, formatCashierPeriod(row)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [cashiers, filter]);

  const columns = useMemo<ColumnDef<OrganizationCashierListItem>[]>(
    () => [
      {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => formatCashierPeriod(row.original)
      },
      {
        accessorKey: 'staffName',
        header: 'Cashier / staff',
        cell: ({ row }) => (
          <Link
            href={tellerCashierDetailPath(tellerId, row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.staffName ?? '—'}
          </Link>
        )
      },
      {
        id: 'isFullDay',
        header: 'Full day',
        cell: ({ row }) => formatYesNo(row.original.isFullDay)
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { sticky: 'right' },
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Link
              href={tellerCashierDetailPath(tellerId, row.original.id)}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
              aria-label={`View ${row.original.staffName ?? 'cashier'}`}
            >
              <Eye className="size-4" />
            </Link>
            {canUpdate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${row.original.staffName ?? 'cashier'}`}
                onClick={() => onEdit(row.original)}
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${row.original.staffName ?? 'cashier'}`}
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        )
      }
    ],
    [canDelete, canUpdate, onDelete, onEdit, tellerId]
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
    <div className="space-y-4">
      <Input
        placeholder="Filter cashiers…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter cashiers"
      />
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No cashiers found"
        emptyDescription="Assign a cashier to manage this teller window."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}

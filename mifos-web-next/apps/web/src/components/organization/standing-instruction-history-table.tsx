'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionRunHistoryItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  standingInstructionAccountLabel,
  standingInstructionClientLabel,
  standingInstructionRunAmountLabel
} from '@/lib/fineract/standing-instruction-display';

export function StandingInstructionHistoryTable({
  items
}: {
  items: StandingInstructionRunHistoryItem[];
}) {
  const columns = useMemo<ColumnDef<StandingInstructionRunHistoryItem>[]>(
    () => [
      {
        id: 'fromClient',
        header: 'From customer',
        cell: ({ row }) => standingInstructionClientLabel(row.original.fromClient)
      },
      {
        id: 'fromAccount',
        header: 'From account',
        cell: ({ row }) => standingInstructionAccountLabel(row.original.fromAccount)
      },
      {
        id: 'toClient',
        header: 'To customer',
        cell: ({ row }) => standingInstructionClientLabel(row.original.toClient)
      },
      {
        id: 'toAccount',
        header: 'To account',
        cell: ({ row }) => standingInstructionAccountLabel(row.original.toAccount)
      },
      {
        accessorKey: 'executionTime',
        header: 'Execution time',
        cell: ({ row }) => row.original.executionTime ?? '—'
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => standingInstructionRunAmountLabel(row.original.amount)
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.status ?? '—'
      },
      {
        id: 'errorLog',
        header: 'Error log',
        cell: ({ row }) => {
          const status = row.original.status?.toLowerCase();
          const errorLog = row.original.errorLog?.trim();
          if (status !== 'failed' || !errorLog) {
            return '—';
          }
          return (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    aria-label="View error log"
                  />
                }
              >
                <AlertCircle className="size-4" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm whitespace-pre-wrap">{errorLog}</TooltipContent>
            </Tooltip>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  return (
    <div className="space-y-4">
      <DataTable<StandingInstructionRunHistoryItem> table={table} stickyHeader={false} />
      <DataTablePagination<StandingInstructionRunHistoryItem>
        table={table}
        totalRecords={items.length}
      />
    </div>
  );
}

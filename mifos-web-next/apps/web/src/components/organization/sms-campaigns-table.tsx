'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SmsCampaignListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Input } from '@/components/ui/input';
import { formatSmsCampaignStatus } from '@/lib/fineract/sms-campaign-display';
import { smsCampaignDetailPath } from '@/lib/fineract/sms-campaign-paths';

export function SmsCampaignsTable({ campaigns }: { campaigns: SmsCampaignListItem[] }) {
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) {
      return campaigns;
    }
    return campaigns.filter((row) => {
      const haystack = [
        row.campaignName,
        row.campaignMessage,
        row.campaignType?.value,
        row.triggerType?.value,
        row.campaignStatus?.value,
        row.smsCampaignTimeLine?.submittedByUsername
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [campaigns, filter]);

  const columns = useMemo<ColumnDef<SmsCampaignListItem>[]>(
    () => [
      {
        id: 'campaignName',
        header: 'Campaign name',
        cell: ({ row }) => (
          <Link
            href={smsCampaignDetailPath(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.campaignName}
          </Link>
        )
      },
      {
        accessorKey: 'campaignMessage',
        header: 'Message',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-muted-foreground">
            {row.original.campaignMessage ?? '—'}
          </span>
        )
      },
      {
        id: 'campaignType',
        header: 'Type',
        cell: ({ row }) => row.original.campaignType?.value ?? '—'
      },
      {
        id: 'triggerType',
        header: 'Trigger',
        cell: ({ row }) => row.original.triggerType?.value ?? '—'
      },
      {
        id: 'campaignStatus',
        header: 'Status',
        cell: ({ row }) => formatSmsCampaignStatus(row.original.campaignStatus?.value)
      },
      {
        id: 'submittedBy',
        header: 'Submitted by',
        cell: ({ row }) => row.original.smsCampaignTimeLine?.submittedByUsername ?? '—'
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
    <div className="space-y-4">
      <Input
        placeholder="Filter SMS campaigns…"
        value={filter}
        onChange={(event) => {
          setFilter(event.target.value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="max-w-sm"
        aria-label="Filter SMS campaigns"
      />
      <DataTable
        table={table}
        emptyMessage="No SMS campaigns found"
        emptyDescription="Create a campaign to send messages based on a business rule."
      />
      <DataTablePagination table={table} totalRecords={filteredRows.length} />
    </div>
  );
}

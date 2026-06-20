'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CenterDetail,
  CenterGroupMember,
  CenterSavingsAccount,
  CenterSummary
} from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import { DetailField, DetailFieldGrid, DetailSection } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { centerStatusVariant, formatCenterDate } from '@/lib/fineract/center-display';

export function CenterGeneralSections({
  center,
  summary,
  savingsAccounts
}: {
  center: CenterDetail;
  summary: CenterSummary;
  savingsAccounts: CenterSavingsAccount[];
}) {
  const groups = center.groupMembers ?? [];

  const groupColumns = useMemo<ColumnDef<CenterGroupMember>[]>(
    () => [
      {
        id: 'accountNo',
        header: 'Account number',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={centerStatusVariant(row.original.status?.code)}>
              {row.original.status?.value ?? '—'}
            </Badge>
            {row.original.accountNo ?? '—'}
          </div>
        )
      },
      {
        accessorKey: 'name',
        header: 'Group name',
        cell: ({ row }) => row.original.name
      },
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        id: 'submittedOn',
        header: 'Submitted on',
        cell: ({ row }) => formatCenterDate(row.original.timeline?.submittedOnDate)
      }
    ],
    []
  );

  const savingsColumns = useMemo<ColumnDef<CenterSavingsAccount>[]>(
    () => [
      {
        id: 'accountNo',
        header: 'Account no.',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={centerStatusVariant(row.original.status?.code)}>
              {row.original.status?.value ?? '—'}
            </Badge>
            {row.original.accountNo ?? '—'}
          </div>
        )
      },
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => row.original.productName ?? '—'
      },
      {
        accessorKey: 'accountBalance',
        header: 'Balance',
        cell: ({ row }) => row.original.accountBalance ?? '—'
      }
    ],
    []
  );

  const groupsTable = useReactTable({
    data: groups,
    columns: groupColumns,
    getCoreRowModel: getCoreRowModel()
  });

  const savingsTable = useReactTable({
    data: savingsAccounts,
    columns: savingsColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-6">
      {center.status?.value === 'Closed' ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          This center is closed.
        </p>
      ) : null}

      <DetailSection title="Summary details">
        <DetailFieldGrid columns={2}>
          <DetailField label="Active customers">{summary.activeClients ?? '—'}</DetailField>
          <DetailField label="Active group loans">{summary.activeGroupLoans ?? '—'}</DetailField>
          <DetailField label="Active customer loans">{summary.activeClientLoans ?? '—'}</DetailField>
          <DetailField label="Active overdue group loans">
            {summary.overdueGroupLoans ?? '—'}
          </DetailField>
          <DetailField label="Active group borrowers">
            {summary.activeGroupBorrowers ?? '—'}
          </DetailField>
          <DetailField label="Active customer borrowers">
            {summary.activeClientBorrowers ?? '—'}
          </DetailField>
          <DetailField label="Active overdue customer loans">
            {summary.overdueClientLoans ?? '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>

      {groups.length > 0 ? (
        <DetailSection title="Groups">
          <DataTable table={groupsTable} stickyHeader={false} emptyMessage="No groups" />
        </DetailSection>
      ) : null}

      {savingsAccounts.length > 0 ? (
        <DetailSection title="Savings account overview">
          <DataTable table={savingsTable} stickyHeader={false} emptyMessage="No savings accounts" />
        </DetailSection>
      ) : null}
    </div>
  );
}

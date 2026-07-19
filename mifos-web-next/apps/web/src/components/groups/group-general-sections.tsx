'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  GroupClientMember,
  GroupDetail,
  GroupLoanAccount,
  GroupSavingsAccount,
  GroupSummary
} from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';
import { DetailField, DetailFieldGrid, DetailSection } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { formatGroupDate, groupStatusVariant } from '@/lib/fineract/group-display';

export function GroupGeneralSections({
  group,
  summary,
  savingsAccounts,
  loanAccounts
}: {
  group: GroupDetail;
  summary: GroupSummary;
  savingsAccounts: GroupSavingsAccount[];
  loanAccounts: GroupLoanAccount[];
}) {
  const members = group.clientMembers ?? [];

  const memberColumns = useMemo<ColumnDef<GroupClientMember>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            href={`/clients/${row.original.id}/general`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.displayName ?? '—'}
          </Link>
        )
      },
      {
        accessorKey: 'accountNo',
        header: 'Account no.',
        cell: ({ row }) => row.original.accountNo ?? '—'
      },
      {
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={groupStatusVariant(row.original.status?.code)}>
            {row.original.status?.value ?? '—'}
          </Badge>
        )
      },
      {
        id: 'submittedOn',
        header: 'Submitted on',
        cell: ({ row }) => formatGroupDate(row.original.timeline?.submittedOnDate)
      }
    ],
    []
  );

  const savingsColumns = useMemo<ColumnDef<GroupSavingsAccount>[]>(
    () => [
      {
        id: 'accountNo',
        header: 'Account no.',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant={groupStatusVariant(row.original.status?.code)}>
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

  const loanColumns = useMemo<ColumnDef<GroupLoanAccount>[]>(
    () => [
      {
        accessorKey: 'accountNo',
        header: 'Account no.',
        cell: ({ row }) => row.original.accountNo ?? '—'
      },
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => row.original.productName ?? '—'
      },
      {
        accessorKey: 'originalLoan',
        header: 'Original loan',
        cell: ({ row }) => row.original.originalLoan ?? '—'
      },
      {
        accessorKey: 'loanBalance',
        header: 'Balance',
        cell: ({ row }) => row.original.loanBalance ?? '—'
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={groupStatusVariant(row.original.status?.code)}>
            {row.original.status?.value ?? '—'}
          </Badge>
        )
      }
    ],
    []
  );

  const membersTable = useReactTable({
    data: members,
    columns: memberColumns,
    getCoreRowModel: getCoreRowModel()
  });

  const savingsTable = useReactTable({
    data: savingsAccounts,
    columns: savingsColumns,
    getCoreRowModel: getCoreRowModel()
  });

  const loansTable = useReactTable({
    data: loanAccounts,
    columns: loanColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-6">
      {group.status?.value === 'Closed' ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          This group is closed.
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

      {members.length > 0 ? (
        <DetailSection title="Customers">
          <DataTable table={membersTable} stickyHeader={false} emptyMessage="No customers" />
        </DetailSection>
      ) : null}

      {loanAccounts.length > 0 ? (
        <DetailSection title="Loan account overview">
          <DataTable table={loansTable} stickyHeader={false} emptyMessage="No loan accounts" />
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

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { OrganizationCashierTransaction } from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import type { AccountCashierSnapshot } from '@/lib/fineract/cashier-display';
import {
  cashierAssignmentStatusLabel,
  cashierAssignmentStatusVariant,
  formatCashierAssignmentPeriod
} from '@/lib/fineract/cashier-display';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';
import { tellerCashierDetailPath } from '@/lib/fineract/teller-paths';
import { cn } from '@/lib/utils';

function formatCashierAmount(amount: number | undefined, currencyCode: string): string {
  if (amount == null) {
    return '—';
  }
  return formatMoney(amount, currencyCode, FINERACT_LOCALE) ?? String(amount);
}

function CashierTransactionsTable({
  transactions,
  currencyCode,
  emptyMessage
}: {
  transactions: OrganizationCashierTransaction[];
  currencyCode: string;
  emptyMessage: string;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });

  const columns = useMemo<ColumnDef<OrganizationCashierTransaction>[]>(
    () => [
      {
        id: 'txnDate',
        header: 'Date',
        cell: ({ row }) => formatFineractDateArray(row.original.txnDate) ?? '—'
      },
      {
        id: 'txnType',
        header: 'Type',
        cell: ({ row }) => row.original.txnType?.value ?? row.original.txnType?.code ?? '—'
      },
      {
        id: 'txnAmount',
        header: 'Amount',
        cell: ({ row }) =>
          formatCashierAmount(
            row.original.txnAmount,
            row.original.currency?.code ?? currencyCode
          )
      },
      {
        id: 'txnNote',
        header: 'Note',
        cell: ({ row }) => row.original.txnNote ?? '—'
      }
    ],
    [currencyCode]
  );

  const table = useReactTable({
    data: transactions,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="space-y-3">
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage={emptyMessage}
        emptyDescription="Cash movements for this cashier session will appear here."
      />
      {transactions.length > 0 ? (
        <DataTablePagination table={table} totalRecords={transactions.length} />
      ) : null}
    </div>
  );
}

export function AccountCashierPanel({ snapshot }: { snapshot: AccountCashierSnapshot }) {
  const displayName =
    snapshot.summary.cashierName ?? snapshot.cashier.staffName ?? `Cashier ${snapshot.cashier.id}`;

  return (
    <div className="space-y-6">
      <DetailSection
        title="Your cashier session"
        description="Your teller assignment, cash position, and transaction history for this account."
        actions={
          snapshot.canOpenCashierDetail ? (
            <Link
              href={tellerCashierDetailPath(snapshot.tellerId, snapshot.cashier.id)}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Open cashier details
            </Link>
          ) : null
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={cashierAssignmentStatusVariant(snapshot.assignmentStatus)}>
            {cashierAssignmentStatusLabel(snapshot.assignmentStatus)}
          </Badge>
          <span className="text-sm text-muted-foreground">{displayName}</span>
        </div>

        <DetailFieldGrid>
          <DetailField label="Teller">{snapshot.tellerName ?? '—'}</DetailField>
          <DetailField label="Branch">{snapshot.summary.officeName ?? '—'}</DetailField>
          <DetailField label="Assignment period">
            {formatCashierAssignmentPeriod(snapshot.cashier)}
          </DetailField>
          <DetailField label="Schedule">
            {snapshot.cashier.isFullDay === false ? 'Partial day' : 'Full day'}
          </DetailField>
          <DetailField label="Net cash">
            {formatCashierAmount(snapshot.summary.netCash, snapshot.currencyCode)}
          </DetailField>
          <DetailField label="Cash allocated">
            {formatCashierAmount(snapshot.summary.sumCashAllocation, snapshot.currencyCode)}
          </DetailField>
          <DetailField label="Cash settled">
            {formatCashierAmount(snapshot.summary.sumCashSettlement, snapshot.currencyCode)}
          </DetailField>
          <DetailField label="Currency">{snapshot.currencyCode}</DetailField>
        </DetailFieldGrid>
      </DetailSection>

      <DetailSection title="Transactions on this account">
        <CashierTransactionsTable
          transactions={snapshot.accountTransactions}
          currencyCode={snapshot.currencyCode}
          emptyMessage="No cashier transactions for this account"
        />
      </DetailSection>

      <DetailSection title="Session history">
        <CashierTransactionsTable
          transactions={snapshot.sessionTransactions}
          currencyCode={snapshot.currencyCode}
          emptyMessage="No transactions in this cashier session"
        />
      </DetailSection>
    </div>
  );
}

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
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CashierSummaryFields } from '@/components/organization/cashier-summary-fields';
import type { AccountCashierSnapshot } from '@/lib/fineract/cashier-display';
import {
  cashierAssignmentStatusLabel,
  cashierAssignmentStatusVariant
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
  const accountTransactionCount = snapshot.accountTransactions.length;
  const sessionTransactionCount = snapshot.sessionTransactions.length;
  const transactionCount = accountTransactionCount + sessionTransactionCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={cashierAssignmentStatusVariant(snapshot.assignmentStatus)}>
            {cashierAssignmentStatusLabel(snapshot.assignmentStatus)}
          </Badge>
          <span className="text-sm text-muted-foreground">{displayName}</span>
        </div>
        {snapshot.canOpenCashierDetail ? (
          <Link
            href={tellerCashierDetailPath(snapshot.tellerId, snapshot.cashier.id)}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Open cashier details
          </Link>
        ) : null}
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions{transactionCount > 0 ? ` (${transactionCount})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0">
          <CashierSummaryFields
            summary={snapshot.summary}
            currencyCode={snapshot.currencyCode}
            cashier={snapshot.cashier}
            tellerName={snapshot.tellerName}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-0 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">On this account</h3>
            <CashierTransactionsTable
              transactions={snapshot.accountTransactions}
              currencyCode={snapshot.currencyCode}
              emptyMessage="No cashier transactions for this account"
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Session history</h3>
            <CashierTransactionsTable
              transactions={snapshot.sessionTransactions}
              currencyCode={snapshot.currencyCode}
              emptyMessage="No transactions in this cashier session"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

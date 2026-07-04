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
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  cashierTransactionCurrencyCode,
  cashierTransactionHasLegalTenderBreakdown,
  cashierTransactionRowKey
} from '@/lib/fineract/cashier-display';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';
import { cn } from '@/lib/utils';

function formatTxnAmount(amount: number | undefined, currencyCode: string): string {
  if (amount == null) {
    return '—';
  }
  return formatMoney(amount, currencyCode, FINERACT_LOCALE) ?? String(amount);
}

function LegalTenderBreakdown({
  transaction,
  currencyCode
}: {
  transaction: OrganizationCashierTransaction;
  currencyCode: string;
}) {
  const lines = transaction.legalTenderLines ?? [];
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">Denomination breakdown</p>
      <ul className="space-y-1 text-sm">
        {lines.map((line, lineIndex) => (
          <li
            key={`${line.legalTenderId}-${lineIndex}`}
            className="flex justify-between gap-3"
          >
            <span>
              {line.quantity} × {line.label}
            </span>
            <span className="tabular-nums">
              {formatTxnAmount(line.lineAmount, currencyCode)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CashierTransactionsTable({
  transactions,
  currencyCode,
  loading = false
}: {
  transactions: OrganizationCashierTransaction[];
  currencyCode: string;
  loading?: boolean;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string>>(() => new Set());

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
        id: 'currencyCode',
        header: 'Currency',
        cell: ({ row }) => cashierTransactionCurrencyCode(row.original, currencyCode)
      },
      {
        id: 'txnAmount',
        header: 'Amount',
        cell: ({ row }) =>
          formatTxnAmount(
            row.original.txnAmount,
            cashierTransactionCurrencyCode(row.original, currencyCode)
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
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row, index) => cashierTransactionRowKey(row, index)
  });

  function toggleExpanded(rowKey: string) {
    setExpandedRowKeys((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="relative space-y-3">
      {loading ? (
        <p
          className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 rounded-md border border-border bg-background/80 py-2 text-sm text-muted-foreground backdrop-blur-sm"
          aria-live="polite"
        >
          <RefreshCw className="size-4 animate-spin" aria-hidden />
          Updating transactions…
        </p>
      ) : null}
      <div className={cn(loading && 'pointer-events-none opacity-60')}>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-10" />
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead key={header.id}>
                  {typeof header.column.columnDef.header === 'string'
                    ? header.column.columnDef.header
                    : header.id}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                  No transactions
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const transaction = row.original;
                const rowCurrency = cashierTransactionCurrencyCode(transaction, currencyCode);
                const rowKey = row.id;
                const canExpand =
                  cashierTransactionHasLegalTenderBreakdown(transaction) &&
                  (transaction.legalTenderLines?.length ?? 0) > 0;
                const isExpanded = expandedRowKeys.has(rowKey);

                return (
                  <Fragment key={rowKey}>
                    <TableRow>
                      <TableCell>
                        {canExpand ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={isExpanded ? 'Hide breakdown' : 'Show breakdown'}
                            onClick={() => toggleExpanded(rowKey)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-4" aria-hidden />
                            ) : (
                              <ChevronRight className="size-4" aria-hidden />
                            )}
                          </Button>
                        ) : null}
                      </TableCell>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {canExpand && isExpanded ? (
                      <TableRow>
                        <TableCell colSpan={columns.length + 1} className="bg-muted/10">
                          <LegalTenderBreakdown transaction={transaction} currencyCode={rowCurrency} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} totalRecords={transactions.length} />
      </div>
    </div>
  );
}

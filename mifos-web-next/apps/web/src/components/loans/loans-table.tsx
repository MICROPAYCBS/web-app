'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoansPage, LoanListItem } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { SortableTableHeader } from '@/components/composites/data-table/sortable-table-header';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { TextField } from '@/components/composites/text-field';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { clientAccountGeneralPath } from '@/lib/fineract/client-account-links';
import {
  buildPortfolioListApiQuery,
  loanListSortColumnFromField,
  loanListSortField,
  type PortfolioListQuery,
  type PortfolioListSortColumn,
  type PortfolioListSortOrder
} from '@/lib/fineract/portfolio-list-query';
import {
  formatPortfolioAccountBalance,
  portfolioAccountStatusVariant
} from '@/lib/fineract/portfolio-list-display';

const DEBOUNCE_MS = 400;

export function LoansTable({
  initialPage,
  initialQuery
}: {
  initialPage: LoansPage;
  initialQuery: PortfolioListQuery;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialPage);
  const [accountNo, setAccountNo] = useState(initialQuery.accountNo ?? '');
  const [debouncedAccountNo, setDebouncedAccountNo] = useState(initialQuery.accountNo ?? '');
  const [includeClosed, setIncludeClosed] = useState(initialQuery.includeClosed);
  const [sortColumn, setSortColumn] = useState<PortfolioListSortColumn | undefined>(
    initialQuery.orderBy ? loanListSortColumnFromField(initialQuery.orderBy) : undefined
  );
  const [sortOrder, setSortOrder] = useState<PortfolioListSortOrder | undefined>(
    initialQuery.sortOrder
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.floor(initialQuery.offset / initialQuery.limit),
    pageSize: initialQuery.limit
  });
  const [pending, startTransition] = useTransition();
  const skipInitialFetch = useRef(true);
  const filterKey = `${debouncedAccountNo}|${includeClosed}|${sortColumn ?? ''}|${sortOrder ?? ''}`;
  const prevFilterKey = useRef(filterKey);

  const syncUrl = useCallback(
    (query: PortfolioListQuery) => {
      const params = new URLSearchParams(buildPortfolioListApiQuery(query));
      const page = Math.floor(query.offset / query.limit);
      if (page > 0) {
        params.set('page', String(page));
      }
      if (query.includeClosed) {
        params.set('includeClosed', 'true');
      }
      const qs = params.toString();
      router.replace(qs ? `/loans?${qs}` : '/loans', { scroll: false });
    },
    [router]
  );

  const fetchPage = useCallback(
    (query: PortfolioListQuery) => {
      startTransition(async () => {
        const res = await fetch(
          `/api/loans?${new URLSearchParams(buildPortfolioListApiQuery(query)).toString()}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          return;
        }
        const json = (await res.json()) as LoansPage;
        setData(json);
        syncUrl(query);
      });
    },
    [syncUrl]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedAccountNo(accountNo), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [accountNo]);

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      prevFilterKey.current = filterKey;
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [filterKey]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchPage({
      offset: pagination.pageIndex * pagination.pageSize,
      limit: pagination.pageSize,
      accountNo: debouncedAccountNo || undefined,
      includeClosed,
      orderBy: sortColumn ? loanListSortField(sortColumn) : undefined,
      sortOrder
    });
  }, [pagination, debouncedAccountNo, includeClosed, sortColumn, sortOrder, fetchPage]);

  const handleSort = useCallback(
    (column: PortfolioListSortColumn) => {
      if (sortColumn === column) {
        setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        return;
      }
      setSortColumn(column);
      setSortOrder('ASC');
    },
    [sortColumn]
  );

  const columns = useMemo<ColumnDef<LoanListItem>[]>(
    () => [
      {
        accessorKey: 'accountNo',
        header: () => (
          <SortableTableHeader
            label="Account no."
            column="accountNo"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => {
          const { id, accountNo: no, clientId } = row.original;
          if (clientId == null) {
            return <span className="font-medium">{no}</span>;
          }
          return (
            <Link
              href={clientAccountGeneralPath(clientId, 'loan', id)}
              className="font-medium text-primary hover:underline"
            >
              {no}
            </Link>
          );
        }
      },
      {
        accessorKey: 'clientName',
        header: () => (
          <SortableTableHeader
            label="Customer"
            column="clientName"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) =>
          row.original.clientId != null && row.original.clientName ? (
            <Link
              href={`/clients/${row.original.clientId}/general`}
              className="text-primary hover:underline"
            >
              {row.original.clientName}
            </Link>
          ) : (
            row.original.clientName ?? '—'
          )
      },
      {
        accessorKey: 'productName',
        header: () => (
          <SortableTableHeader
            label="Product"
            column="productName"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => row.original.productName ?? '—'
      },
      {
        id: 'status',
        header: () => (
          <SortableTableHeader
            label="Status"
            column="status"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => (
          <Badge variant={portfolioAccountStatusVariant(row.original.status?.code)}>
            {row.original.status?.value ?? '—'}
          </Badge>
        )
      },
      {
        accessorKey: 'officeName',
        header: () => (
          <SortableTableHeader
            label="Branch"
            column="officeName"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ),
        cell: ({ row }) => row.original.officeName ?? '—'
      },
      {
        id: 'balance',
        header: () => (
          <SortableTableHeader
            label="Balance"
            column="balance"
            activeColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
            align="right"
          />
        ),
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            {formatPortfolioAccountBalance(
              row.original.loanBalance,
              row.original.currency?.code
            )}
            {row.original.inArrears ? (
              <span className="ml-2 text-destructive">In arrears</span>
            ) : null}
          </span>
        )
      }
    ],
    [handleSort, sortColumn, sortOrder]
  );

  const table = useReactTable({
    data: data.pageItems,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    pageCount: Math.max(1, Math.ceil(data.totalFilteredRecords / pagination.pageSize)),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <TextField
          label="Account number"
          value={accountNo}
          onChange={setAccountNo}
          placeholder="Filter by account number"
          className="max-w-sm"
          disabled={pending}
        />
        <div className="flex items-center gap-2">
          <Checkbox
            id="loans-include-closed"
            checked={includeClosed}
            onCheckedChange={(checked) => setIncludeClosed(checked === true)}
          />
          <Label htmlFor="loans-include-closed" className="font-normal">
            Show closed accounts
          </Label>
        </div>
      </div>
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No loan accounts found."
        emptyDescription="Try adjusting the account number filter or include closed accounts."
        isLoading={pending}
      />
      <DataTablePagination table={table} totalRecords={data.totalFilteredRecords} />
    </div>
  );
}

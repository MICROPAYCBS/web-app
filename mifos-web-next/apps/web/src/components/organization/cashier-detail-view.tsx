'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  OrganizationCashierListItem,
  OrganizationCashierSummary,
  OrganizationCashierTransaction,
  OrganizationTeller
} from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import { formatActionErrorMessage } from '@mifos/validation';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { loadCashierSummaryAction } from '@/actions/cashier';
import { CashierCashActionSheet } from '@/components/organization/cashier-cash-action-sheet';
import { CashierFormSheet } from '@/components/organization/cashier-form-sheet';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';
import { FINERACT_LOCALE, formatFineractDateArray } from '@/lib/fineract/dates';
import { tellerCashiersPath } from '@/lib/fineract/teller-paths';
import type { SelectOption } from '@/components/composites/select-field';

function sortTransactions(
  transactions: OrganizationCashierTransaction[]
): OrganizationCashierTransaction[] {
  return [...transactions].sort((left, right) => {
    const leftTime = Date.parse(formatFineractDateArray(left.txnDate) ?? '') || 0;
    const rightTime = Date.parse(formatFineractDateArray(right.txnDate) ?? '') || 0;
    return rightTime - leftTime;
  });
}

function formatSummaryAmount(
  amount: number | undefined,
  currencyCode: string
): string {
  if (amount == null) {
    return '—';
  }
  return formatMoney(amount, currencyCode, FINERACT_LOCALE) ?? String(amount);
}

export function CashierDetailView({
  teller,
  cashier,
  currencies,
  initialCurrencyCode,
  initialSummary,
  canUpdate,
  canAllocate,
  canSettle
}: {
  teller: OrganizationTeller;
  cashier: OrganizationCashierListItem;
  currencies: FineractCurrencyOption[];
  initialCurrencyCode: string;
  initialSummary: OrganizationCashierSummary;
  canUpdate: boolean;
  canAllocate: boolean;
  canSettle: boolean;
}) {
  const [currencyCode, setCurrencyCode] = useState(initialCurrencyCode);
  const [summary, setSummary] = useState(initialSummary);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSummary(initialSummary);
    setCurrencyCode(initialCurrencyCode);
  }, [initialCurrencyCode, initialSummary]);

  const currencyOptions = useMemo<SelectOption[]>(
    () =>
      currencies
        .filter((currency) => currency.code)
        .map((currency) => ({
          value: currency.code!,
          label: currency.name ? `${currency.code} — ${currency.name}` : currency.code!,
          keywords: [currency.code!, currency.name].filter(Boolean) as string[]
        })),
    [currencies]
  );

  const transactions = useMemo(
    () => sortTransactions(summary.cashierTransactions?.pageItems ?? []),
    [summary.cashierTransactions?.pageItems]
  );

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
          formatSummaryAmount(
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

  function reloadSummary(nextCurrencyCode: string) {
    setSummaryError(null);
    startTransition(async () => {
      const result = await loadCashierSummaryAction(teller.id, cashier.id, nextCurrencyCode);
      if (!result.ok) {
        setSummaryError(formatActionErrorMessage(result.message));
        return;
      }
      setSummary(result.summary);
      setCurrencyCode(nextCurrencyCode);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    });
  }

  const displayName =
    summary.cashierName ?? cashier.staffName ?? `Cashier ${cashier.id}`;

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink
                href={tellerCashiersPath(teller.id)}
                label="Back to cashiers"
              />
            }
            title={displayName}
            meta={[summary.tellerName ?? teller.name, summary.officeName ?? teller.officeName]
              .filter(Boolean)
              .join(' · ')}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <SelectField
                  label="Currency"
                  value={currencyCode}
                  onValueChange={(value) => {
                    if (value && value !== currencyCode) {
                      reloadSummary(value);
                    }
                  }}
                  options={currencyOptions}
                  disabled={pending || currencyOptions.length === 0}
                  className="w-48"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => reloadSummary(currencyCode)}
                >
                  <RefreshCw className="mr-2 size-4" />
                  Refresh
                </Button>
                {canUpdate ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit assignment
                  </Button>
                ) : null}
                {canAllocate ? (
                  <Button type="button" size="sm" onClick={() => setAllocateOpen(true)}>
                    <ArrowDownToLine className="mr-2 size-4" />
                    Allocate
                  </Button>
                ) : null}
                {canSettle ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setSettleOpen(true)}
                  >
                    <ArrowUpFromLine className="mr-2 size-4" />
                    Settle
                  </Button>
                ) : null}
              </div>
            }
          />
        }
      >
        {summaryError ? (
          <p className="mb-4 text-sm text-destructive">{summaryError}</p>
        ) : null}

        <DetailSection title="Cash summary">
          <DetailFieldGrid>
            <DetailField label="Net cash">
              {formatSummaryAmount(summary.netCash, currencyCode)}
            </DetailField>
            <DetailField label="Cash allocated">
              {formatSummaryAmount(summary.sumCashAllocation, currencyCode)}
            </DetailField>
            <DetailField label="Cash settled">
              {formatSummaryAmount(summary.sumCashSettlement, currencyCode)}
            </DetailField>
            <DetailField label="Inward cash">
              {formatSummaryAmount(summary.sumInwardCash, currencyCode)}
            </DetailField>
            <DetailField label="Outward cash">
              {formatSummaryAmount(summary.sumOutwardCash, currencyCode)}
            </DetailField>
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title="Transactions">
          <DataTable
            table={table}
            stickyHeader={false}
            emptyMessage="No transactions"
            emptyDescription="Cashier transactions for the selected currency will appear here."
          />
          <DataTablePagination table={table} totalRecords={transactions.length} />
        </DetailSection>
      </DetailPage>

      {canUpdate ? (
        <CashierFormSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          tellerId={teller.id}
          staff={[]}
          cashier={cashier}
        />
      ) : null}

      {canAllocate ? (
        <CashierCashActionSheet
          open={allocateOpen}
          onOpenChange={setAllocateOpen}
          mode="allocate"
          tellerId={teller.id}
          cashierId={cashier.id}
          currencyCode={currencyCode}
        />
      ) : null}

      {canSettle ? (
        <CashierCashActionSheet
          open={settleOpen}
          onOpenChange={setSettleOpen}
          mode="settle"
          tellerId={teller.id}
          cashierId={cashier.id}
          currencyCode={currencyCode}
        />
      ) : null}
    </>
  );
}

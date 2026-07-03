'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem, FineractSavingsAccountDetail } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type VisibilityState
} from '@tanstack/react-table';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  DetailSummary,
  MoneyValue
} from '@/components/composites';
import { SavingsTransactionActionsMenu } from '@/components/clients/savings/actions/savings-transaction-actions-menu';
import { SavingsAccountAuditView } from '@/components/clients/savings/savings-account-audit-view';
import { SavingsStatementSection } from '@/components/clients/savings/statement';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTableColumnVisibility } from '@/components/composites/data-table/data-table-column-visibility';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import { savingsAccountTransactionPath } from '@/lib/fineract/client-account-links';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import {
  formatSavingsAccountDate,
  formatSavingsAccountMoney,
  formatSavingsChargeStatus,
  formatSavingsTransactionType,
  isSavingsTransactionAccrual,
  isSavingsTransactionDebit,
  savingsAccountCurrencyCode,
  savingsAccountProductName,
  savingsAccountTimelineName,
  savingsTransactionDate,
  savingsTransactionRowClassName,
  type SavingsAccountSectionId
} from '@/lib/fineract/savings-account-display';
import type { SavingsTransactionActionPermissions } from '@/lib/fineract/savings-transaction-actions';
import { cn } from '@/lib/utils';

function SavingsAccountSummarySection({ account }: { account: FineractSavingsAccountDetail }) {
  const currency = savingsAccountCurrencyCode(account);
  const summary = account.summary;
  const onHold = account.onHoldFunds ?? account.savingsAmountOnHold ?? 0;
  const timeline = account.timeline;

  const kpiItems = [
    {
      id: 'available',
      label: 'Available balance',
      value: (
        <MoneyValue
          amount={summary?.availableBalance}
          currencyCode={currency}
          emphasize
        />
      )
    },
    {
      id: 'balance',
      label: 'Account balance',
      value: <MoneyValue amount={summary?.accountBalance} currencyCode={currency} />
    },
    {
      id: 'deposits',
      label: 'Total deposits',
      value: <MoneyValue amount={summary?.totalDeposits} currencyCode={currency} />
    },
    {
      id: 'withdrawals',
      label: 'Total withdrawals',
      value: <MoneyValue amount={summary?.totalWithdrawals} currencyCode={currency} />
    }
  ];

  const timelineRows = [
    {
      label: 'Submitted',
      date: timeline?.submittedOnDate,
      by: savingsAccountTimelineName(timeline) ?? timeline?.submittedByUsername
    },
    {
      label: 'Approved',
      date: timeline?.approvedOnDate,
      by: timeline?.approvedByUsername
    },
    {
      label: 'Activated',
      date: timeline?.activatedOnDate,
      by: timeline?.activatedByUsername
    },
    {
      label: 'Closed',
      date: timeline?.closedOnDate,
      by: timeline?.closedByUsername
    }
  ].filter((row) => row.date);

  return (
    <div className="space-y-6">
      <DetailSummary items={kpiItems} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Account summary">
          <DetailFieldGrid>
            <DetailField label="Product">{savingsAccountProductName(account)}</DetailField>
            <DetailField label="Account no.">{account.accountNo}</DetailField>
            <DetailField label="External ID">{account.externalId?.trim() || '—'}</DetailField>
            <DetailField label="Currency">{account.currency.name ?? currency}</DetailField>
            <DetailField label="Branch">{account.officeName ?? '—'}</DetailField>
            <DetailField label="Field officer">{account.fieldOfficerName ?? '—'}</DetailField>
            {account.depositType ? (
              <DetailField label="Deposit type">
                {enumOptionLabel(account.depositType) ?? '—'}
              </DetailField>
            ) : null}
            {account.nominalAnnualInterestRate !== undefined ? (
              <DetailField label="Nominal annual interest">
                {account.nominalAnnualInterestRate}%
              </DetailField>
            ) : null}
            {account.interestCompoundingPeriodType ? (
              <DetailField label="Interest compounding">
                {enumOptionLabel(account.interestCompoundingPeriodType) ?? '—'}
              </DetailField>
            ) : null}
            {account.interestCalculationType ? (
              <DetailField label="Interest calculation">
                {enumOptionLabel(account.interestCalculationType) ?? '—'}
              </DetailField>
            ) : null}
            {account.interestCalculationDaysInYearType ? (
              <DetailField label="Days in year">
                {enumOptionLabel(account.interestCalculationDaysInYearType) ?? '—'}
              </DetailField>
            ) : null}
            {account.lastActiveTransactionDate ? (
              <DetailField label="Last transaction">
                {formatSavingsAccountDate(account.lastActiveTransactionDate)}
              </DetailField>
            ) : null}
            {onHold > 0 ? (
              <DetailField label="On hold">
                {formatSavingsAccountMoney(account, onHold)}
              </DetailField>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title="Timeline">
          {timelineRows.length ? (
            <ul className="space-y-4">
              {timelineRows.map((row) => (
                <li key={row.label} className="flex flex-col gap-0.5 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {formatSavingsAccountDate(row.date)}
                    {row.by ? ` · ${row.by}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No timeline events recorded.</p>
          )}
        </DetailSection>
      </div>

      {summary &&
      (summary.totalInterestEarned !== undefined ||
        summary.totalInterestPosted !== undefined ||
        summary.totalFeeCharge !== undefined ||
        summary.totalPenaltyCharge !== undefined) ? (
        <DetailSection title="Interest and charges">
          <DetailFieldGrid>
            {summary.totalInterestEarned !== undefined ? (
              <DetailField label="Interest earned">
                <MoneyValue amount={summary.totalInterestEarned} currencyCode={currency} />
              </DetailField>
            ) : null}
            {summary.totalInterestPosted !== undefined ? (
              <DetailField label="Interest posted">
                <MoneyValue amount={summary.totalInterestPosted} currencyCode={currency} />
              </DetailField>
            ) : null}
            {summary.interestNotPosted !== undefined ? (
              <DetailField label="Interest not posted">
                <MoneyValue amount={summary.interestNotPosted} currencyCode={currency} />
              </DetailField>
            ) : null}
            {summary.totalFeeCharge !== undefined ? (
              <DetailField label="Fees charged">
                <MoneyValue amount={summary.totalFeeCharge} currencyCode={currency} />
              </DetailField>
            ) : null}
            {summary.totalPenaltyCharge !== undefined ? (
              <DetailField label="Penalties charged">
                <MoneyValue amount={summary.totalPenaltyCharge} currencyCode={currency} />
              </DetailField>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>
      ) : null}
    </div>
  );
}

type TransactionRow = NonNullable<FineractSavingsAccountDetail['transactions']>[number];

const DEFAULT_TRANSACTION_COLUMN_VISIBILITY: VisibilityState = {
  externalId: false
};

function SavingsTransactionAmountDisplay({ transaction }: { transaction: TransactionRow }) {
  const debit = isSavingsTransactionDebit(transaction);
  const formatted = formatAccountMoney(transaction.amount);
  if (formatted === '—') {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn('tabular-nums', debit ? 'text-destructive' : 'text-success')}
    >
      {debit ? `-${formatted}` : `+${formatted}`}
    </span>
  );
}

function TransactionCell({
  transaction,
  children
}: {
  transaction: TransactionRow;
  children: ReactNode;
}) {
  return <span className={cn(savingsTransactionRowClassName(transaction))}>{children}</span>;
}

function buildTransactionColumns(
  account: FineractSavingsAccountDetail,
  clientId: string,
  transactionActionPermissions: SavingsTransactionActionPermissions
): ColumnDef<TransactionRow>[] {
  const currency = savingsAccountCurrencyCode(account);

  return [
    {
      id: 'row',
      header: '#',
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        const index = pageIndex * pageSize + row.index + 1;
        return (
          <TransactionCell transaction={row.original}>
            <span className="tabular-nums text-muted-foreground">{index}</span>
          </TransactionCell>
        );
      }
    },
    {
      accessorKey: 'id',
      header: 'Id',
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          <Link
            href={savingsAccountTransactionPath(clientId, account.id, row.original.id)}
            className="tabular-nums text-primary underline-offset-4 hover:underline"
          >
            {row.original.id}
          </Link>
        </TransactionCell>
      )
    },
    {
      id: 'date',
      header: 'Transaction date',
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          {formatSavingsAccountDate(savingsTransactionDate(row.original))}
        </TransactionCell>
      )
    },
    {
      id: 'externalId',
      header: 'External ID',
      meta: { label: 'External ID' },
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          {row.original.externalId?.trim() || '—'}
        </TransactionCell>
      )
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          {formatSavingsTransactionType(row.original)}
        </TransactionCell>
      )
    },
    {
      id: 'amount',
      header: () => <span className="block w-full text-right">Amount</span>,
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          <span className="block w-full text-right">
            <SavingsTransactionAmountDisplay transaction={row.original} />
          </span>
        </TransactionCell>
      )
    },
    {
      id: 'balance',
      header: () => <span className="block w-full text-right">Balance</span>,
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          <span className="block w-full text-right tabular-nums">
            {formatAccountMoney(row.original.runningBalance)}
          </span>
        </TransactionCell>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.reversed ? (
          <Badge variant="outline">Reversed</Badge>
        ) : row.original.transfer ? (
          <Badge variant="secondary">Transfer</Badge>
        ) : isSavingsTransactionAccrual(row.original) ? (
          <Badge variant="outline">Accrual</Badge>
        ) : (
          <Badge variant="secondary">Posted</Badge>
        )
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      meta: { sticky: 'right' },
      cell: ({ row }) => (
        <SavingsTransactionActionsMenu
          clientId={clientId}
          accountId={account.id}
          accountNo={account.accountNo}
          clientName={account.clientName}
          orgName={account.officeName}
          transaction={row.original}
          currencyCode={currency}
          permissions={transactionActionPermissions}
          showViewTransaction
        />
      )
    }
  ];
}

function filterSavingsTransactions(
  transactions: TransactionRow[],
  hideReversed: boolean,
  hideAccruals: boolean
): TransactionRow[] {
  return transactions.filter((transaction) => {
    if (hideReversed && transaction.reversed) {
      return false;
    }
    if (hideAccruals && isSavingsTransactionAccrual(transaction)) {
      return false;
    }
    return true;
  });
}

function SavingsAccountTransactionsSection({
  account,
  clientId,
  transactionActionPermissions
}: {
  account: FineractSavingsAccountDetail;
  clientId: string;
  transactionActionPermissions: SavingsTransactionActionPermissions;
}) {
  const [hideReversed, setHideReversed] = useState(false);
  const [hideAccruals, setHideAccruals] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_TRANSACTION_COLUMN_VISIBILITY
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });

  const allRows = useMemo(() => {
    const transactions = account.transactions ?? [];
    return [...transactions].sort((a, b) => b.id - a.id);
  }, [account.transactions]);

  const rows = useMemo(
    () => filterSavingsTransactions(allRows, hideReversed, hideAccruals),
    [allRows, hideAccruals, hideReversed]
  );

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [hideAccruals, hideReversed]);

  const columns = useMemo(
    () => buildTransactionColumns(account, clientId, transactionActionPermissions),
    [account, clientId, transactionActionPermissions]
  );
  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination, columnVisibility },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const showFilters = allRows.length > 0;

  return (
    <DetailSection title="Transactions">
      {showFilters ? (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
          <DataTableColumnVisibility
            table={table}
            onReset={() => setColumnVisibility(DEFAULT_TRANSACTION_COLUMN_VISIBILITY)}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="savings-hide-reversed"
              checked={hideReversed}
              onCheckedChange={(checked) => setHideReversed(checked === true)}
            />
            <Label htmlFor="savings-hide-reversed" className="cursor-pointer text-sm font-normal">
              Hide reversed
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="savings-hide-accruals"
              checked={hideAccruals}
              onCheckedChange={(checked) => setHideAccruals(checked === true)}
            />
            <Label htmlFor="savings-hide-accruals" className="cursor-pointer text-sm font-normal">
              Hide accruals
            </Label>
          </div>
        </div>
      ) : null}
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No transactions yet."
        emptyDescription="Deposits, withdrawals, and interest postings will appear here."
      />
      {rows.length > 0 ? (
        <div className="mt-4">
          <DataTablePagination table={table} totalRecords={rows.length} />
        </div>
      ) : null}
    </DetailSection>
  );
}

type ChargeRow = NonNullable<FineractSavingsAccountDetail['charges']>[number];

function buildChargeColumns(account: FineractSavingsAccountDetail): ColumnDef<ChargeRow>[] {
  const currency = savingsAccountCurrencyCode(account);

  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.name}
          {row.original.penalty ? (
            <Badge variant="outline" className="ml-2">
              Penalty
            </Badge>
          ) : null}
        </span>
      )
    },
    {
      id: 'time',
      header: 'Charge time',
      cell: ({ row }) => enumOptionLabel(row.original.chargeTimeType) ?? '—'
    },
    {
      id: 'due',
      header: 'Due date',
      cell: ({ row }) => formatSavingsAccountDate(row.original.dueDate)
    },
    {
      id: 'amount',
      header: () => <span className="block w-full text-right">Amount</span>,
      cell: ({ row }) => (
        <span className="block w-full text-right tabular-nums">
          <MoneyValue amount={row.original.amount} currencyCode={currency} />
        </span>
      )
    },
    {
      id: 'outstanding',
      header: () => <span className="block w-full text-right">Outstanding</span>,
      cell: ({ row }) => (
        <span className="block w-full text-right tabular-nums">
          <MoneyValue amount={row.original.amountOutstanding} currencyCode={currency} />
        </span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline">{formatSavingsChargeStatus(row.original)}</Badge>
      )
    }
  ];
}

function SavingsAccountChargesSection({ account }: { account: FineractSavingsAccountDetail }) {
  const rows = account.charges ?? [];
  const columns = useMemo(() => buildChargeColumns(account), [account]);
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DetailSection title="Charges">
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No charges on this account."
      />
    </DetailSection>
  );
}

export function SavingsAccountSectionPanel({
  section,
  account,
  clientId,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords,
  transactionActionPermissions = {
    undoTransaction: false,
    undoTransfer: false,
    modifyTransaction: false,
    viewJournal: false
  }
}: {
  section: SavingsAccountSectionId;
  account: FineractSavingsAccountDetail;
  clientId: string;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
  transactionActionPermissions?: SavingsTransactionActionPermissions;
}) {
  switch (section) {
    case 'summary':
      return <SavingsAccountSummarySection account={account} />;
    case 'transactions':
      return (
        <SavingsAccountTransactionsSection
          account={account}
          clientId={clientId}
          transactionActionPermissions={transactionActionPermissions}
        />
      );
    case 'statement':
      return <SavingsStatementSection account={account} />;
    case 'charges':
      return <SavingsAccountChargesSection account={account} />;
    case 'audit':
      return canViewAudits ? (
        <SavingsAccountAuditView
          audits={auditEntries}
          loadFailed={auditLoadFailed}
          totalRecords={auditTotalRecords}
        />
      ) : null;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountDetail } from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type VisibilityState
} from '@tanstack/react-table';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  DetailSummary,
  MoneyValue
} from '@/components/composites';
import { DepositTransactionActionsMenu } from '@/components/clients/accounts/actions/deposit-transaction-actions-menu';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTableColumnVisibility } from '@/components/composites/data-table/data-table-column-visibility';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import type {
  DepositAccountSectionId,
  TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';
import type { DepositTransactionActionPermissions } from '@/lib/fineract/deposit-transaction-actions';
import { formatTimelineActorByRole } from '@/lib/fineract/account-timeline-display';
import {
  formatSavingsAccountDate,
  formatSavingsAccountMoney,
  formatSavingsChargeStatus,
  formatSavingsTransactionType,
  isSavingsTransactionAccrual,
  isSavingsTransactionDebit,
  savingsAccountCurrencyCode,
  savingsAccountProductName,
  savingsTransactionDate,
  savingsTransactionRowClassName,
  sortSavingsAccountTransactions,
  sumSavingsCashMovementTotals
} from '@/lib/fineract/savings-account-display';
import { cn } from '@/lib/utils';

function DepositAccountSummarySection({ account }: { account: FineractSavingsAccountDetail }) {
  const currency = savingsAccountCurrencyCode(account);
  const summary = account.summary;
  const onHold = account.onHoldFunds ?? account.savingsAmountOnHold ?? 0;
  const timeline = account.timeline;

  const cashMovements = account.transactions
    ? sumSavingsCashMovementTotals(account.transactions)
    : null;
  const totalDeposits = cashMovements?.totalDeposits ?? summary?.totalDeposits;
  const totalWithdrawals = cashMovements?.totalWithdrawals ?? summary?.totalWithdrawals;

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
      value: <MoneyValue amount={totalDeposits} currencyCode={currency} />
    },
    {
      id: 'withdrawals',
      label: 'Total withdrawals',
      value: <MoneyValue amount={totalWithdrawals} currencyCode={currency} />
    }
  ];

  const timelineRows = [
    {
      label: 'Submitted',
      date: timeline?.submittedOnDate,
      by: formatTimelineActorByRole(timeline, 'submitted')
    },
    {
      label: 'Approved',
      date: timeline?.approvedOnDate,
      by: formatTimelineActorByRole(timeline, 'approved')
    },
    {
      label: 'Activated',
      date: timeline?.activatedOnDate,
      by: formatTimelineActorByRole(timeline, 'activated')
    },
    {
      label: 'Closed',
      date: timeline?.closedOnDate,
      by: formatTimelineActorByRole(timeline, 'closed')
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
            {timeline?.submittedOnDate ? (
              <DetailField label="Submitted on">
                {formatSavingsAccountDate(timeline.submittedOnDate)}
              </DetailField>
            ) : null}
            {timeline?.approvedOnDate ? (
              <DetailField label="Approved on">
                {formatSavingsAccountDate(timeline.approvedOnDate)}
              </DetailField>
            ) : null}
            {timeline?.activatedOnDate ? (
              <DetailField label="Activated on">
                {formatSavingsAccountDate(timeline.activatedOnDate)}
              </DetailField>
            ) : null}
            {timeline?.rejectedOnDate ? (
              <DetailField label="Rejected on">
                {formatSavingsAccountDate(timeline.rejectedOnDate)}
              </DetailField>
            ) : null}
            {timeline?.withdrawnOnDate ? (
              <DetailField label="Withdrawn on">
                {formatSavingsAccountDate(timeline.withdrawnOnDate)}
              </DetailField>
            ) : null}
            {timeline?.closedOnDate ? (
              <DetailField label="Closed on">
                {formatSavingsAccountDate(timeline.closedOnDate)}
              </DetailField>
            ) : null}
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
            {account.interestPostingPeriodType ? (
              <DetailField label="Interest posting period">
                {enumOptionLabel(account.interestPostingPeriodType) ?? '—'}
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
      ((summary.totalInterestEarned !== undefined && summary.totalInterestEarned >= 0) ||
        summary.totalInterestPosted !== undefined ||
        summary.interestNotPosted !== undefined ||
        summary.totalFeeCharge !== undefined ||
        summary.totalPenaltyCharge !== undefined) ? (
        <DetailSection title="Interest and charges">
          <DetailFieldGrid>
            {summary.totalInterestEarned !== undefined && summary.totalInterestEarned >= 0 ? (
              <DetailField label="Interest earned">
                <MoneyValue amount={summary.totalInterestEarned} currencyCode={currency} />
              </DetailField>
            ) : null}
            {summary.totalInterestPosted !== undefined ? (
              <DetailField label="Interest posted">
                <MoneyValue amount={summary.totalInterestPosted} currencyCode={currency} />
              </DetailField>
            ) : null}
            {summary.interestNotPosted !== undefined && summary.interestNotPosted >= 0 ? (
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
  externalId: false,
  user: false
};

function DepositTransactionAmountDisplay({ transaction }: { transaction: TransactionRow }) {
  const debit = isSavingsTransactionDebit(transaction);
  const formatted = formatAccountMoney(transaction.amount);
  if (formatted === '—') {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className={cn('tabular-nums', debit ? 'text-destructive' : 'text-success')}>
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

function buildDepositTransactionColumns({
  kind,
  account,
  clientId,
  reportOrgName,
  transactionActionPermissions
}: {
  kind: TermDepositAccountKind;
  account: FineractSavingsAccountDetail;
  clientId: string;
  reportOrgName: string;
  transactionActionPermissions: DepositTransactionActionPermissions;
}): ColumnDef<TransactionRow>[] {
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
          <span className="tabular-nums">{row.original.id}</span>
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
            <DepositTransactionAmountDisplay transaction={row.original} />
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
      id: 'user',
      header: 'User',
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          {row.original.submittedByUsername?.trim() || '—'}
        </TransactionCell>
      )
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      meta: { sticky: 'right' },
      cell: ({ row }) => (
        <DepositTransactionActionsMenu
          kind={kind}
          clientId={clientId}
          accountId={account.id}
          accountNo={account.accountNo}
          clientName={account.clientName}
          orgName={reportOrgName}
          transaction={row.original}
          currencyCode={currency}
          permissions={transactionActionPermissions}
        />
      )
    }
  ];
}

function filterDepositTransactions(
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

function DepositAccountTransactionsSection({
  kind,
  account,
  clientId,
  reportOrgName,
  transactionActionPermissions
}: {
  kind: TermDepositAccountKind;
  account: FineractSavingsAccountDetail;
  clientId: string;
  reportOrgName: string;
  transactionActionPermissions: DepositTransactionActionPermissions;
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

  const allRows = useMemo(
    () => sortSavingsAccountTransactions(account.transactions ?? []),
    [account.transactions]
  );

  const rows = useMemo(
    () => filterDepositTransactions(allRows, hideReversed, hideAccruals),
    [allRows, hideAccruals, hideReversed]
  );

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [hideAccruals, hideReversed]);

  const columns = useMemo(
    () =>
      buildDepositTransactionColumns({
        kind,
        account,
        clientId,
        reportOrgName,
        transactionActionPermissions
      }),
    [account, clientId, kind, reportOrgName, transactionActionPermissions]
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
              id="deposit-hide-reversed"
              checked={hideReversed}
              onCheckedChange={(checked) => setHideReversed(checked === true)}
            />
            <Label htmlFor="deposit-hide-reversed" className="cursor-pointer text-sm font-normal">
              Hide reversed
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="deposit-hide-accruals"
              checked={hideAccruals}
              onCheckedChange={(checked) => setHideAccruals(checked === true)}
            />
            <Label htmlFor="deposit-hide-accruals" className="cursor-pointer text-sm font-normal">
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

function buildDepositChargeColumns(account: FineractSavingsAccountDetail): ColumnDef<ChargeRow>[] {
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

function DepositAccountChargesSection({ account }: { account: FineractSavingsAccountDetail }) {
  const rows = account.charges ?? [];
  const columns = useMemo(() => buildDepositChargeColumns(account), [account]);
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

export function DepositAccountSectionPanel({
  section,
  account,
  kind,
  clientId,
  reportOrgName,
  transactionActionPermissions = {
    undoTransaction: false,
    viewJournal: false
  }
}: {
  section: DepositAccountSectionId;
  account: FineractSavingsAccountDetail;
  kind: TermDepositAccountKind;
  clientId: string;
  reportOrgName: string;
  transactionActionPermissions?: DepositTransactionActionPermissions;
}) {
  switch (section) {
    case 'summary':
      return <DepositAccountSummarySection account={account} />;
    case 'transactions':
      return (
        <DepositAccountTransactionsSection
          kind={kind}
          account={account}
          clientId={clientId}
          reportOrgName={reportOrgName}
          transactionActionPermissions={transactionActionPermissions}
        />
      );
    case 'charges':
      return <DepositAccountChargesSection account={account} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

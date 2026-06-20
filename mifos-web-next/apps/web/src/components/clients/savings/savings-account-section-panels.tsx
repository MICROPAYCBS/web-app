'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountDetail } from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  DetailSummary,
  MoneyValue
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import {
  formatSavingsAccountDate,
  formatSavingsAccountMoney,
  formatSavingsChargeStatus,
  formatSavingsTransactionPaymentDetail,
  formatSavingsTransactionType,
  isSavingsTransactionCredit,
  savingsAccountCurrencyCode,
  savingsAccountProductName,
  savingsAccountTimelineName,
  type SavingsAccountSectionId
} from '@/lib/fineract/savings-account-display';
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

function buildTransactionColumns(
  account: FineractSavingsAccountDetail
): ColumnDef<TransactionRow>[] {
  const currency = savingsAccountCurrencyCode(account);

  return [
    {
      accessorKey: 'id',
      header: 'Id',
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{row.original.id}</span>
      )
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => formatSavingsAccountDate(row.original.submittedOnDate)
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => formatSavingsTransactionType(row.original)
    },
    {
      id: 'amount',
      header: () => <span className="block w-full text-right">Amount</span>,
      cell: ({ row }) => {
        const credit = isSavingsTransactionCredit(row.original);
        return (
          <span
            className={cn(
              'block w-full text-right tabular-nums',
              credit ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <MoneyValue amount={row.original.amount} currencyCode={currency} />
          </span>
        );
      }
    },
    {
      id: 'balance',
      header: () => <span className="block w-full text-right">Balance</span>,
      cell: ({ row }) => (
        <span className="block w-full text-right tabular-nums">
          <MoneyValue amount={row.original.runningBalance} currencyCode={currency} />
        </span>
      )
    },
    {
      id: 'payment',
      header: 'Payment detail',
      cell: ({ row }) => formatSavingsTransactionPaymentDetail(row.original)
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.reversed ? (
          <Badge variant="outline">Reversed</Badge>
        ) : (
          <Badge variant="secondary">Posted</Badge>
        )
    }
  ];
}

function SavingsAccountTransactionsSection({
  account
}: {
  account: FineractSavingsAccountDetail;
}) {
  const rows = useMemo(() => {
    const transactions = account.transactions ?? [];
    return [...transactions].sort((a, b) => b.id - a.id);
  }, [account.transactions]);

  const columns = useMemo(() => buildTransactionColumns(account), [account]);
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DetailSection title="Transactions">
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No transactions yet."
        emptyDescription="Deposits, withdrawals, and interest postings will appear here."
      />
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
  account
}: {
  section: SavingsAccountSectionId;
  account: FineractSavingsAccountDetail;
}) {
  switch (section) {
    case 'summary':
      return <SavingsAccountSummarySection account={account} />;
    case 'transactions':
      return <SavingsAccountTransactionsSection account={account} />;
    case 'charges':
      return <SavingsAccountChargesSection account={account} />;
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

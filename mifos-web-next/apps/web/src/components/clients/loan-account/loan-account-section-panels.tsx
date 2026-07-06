'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import Link from 'next/link';

import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { LoanAccountAuditView } from '@/components/clients/loan-account/loan-account-audit-view';
import { LoanAccountSchedulePreview } from '@/components/clients/loan-account/loan-account-schedule-preview';
import { LoanAccountStandingInstructionsSection } from '@/components/clients/loan-account/loan-account-standing-instructions-section';
import type { LoanAccountStandingInstructionContext } from '@/components/clients/loan-account/loan-account-standing-instruction-context';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  DetailSummary,
  MoneyValue
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import { clientAccountGeneralPath, loanAccountTransactionPath } from '@/lib/fineract/client-account-links';
import type {
  FineractLoanAccountCharge,
  FineractLoanAccountDetail,
  FineractLoanAccountDisbursementDetail,
  FineractLoanAccountTransaction,
  LoanAccountSummaryMatrixRow
} from '@/lib/fineract/loan-account-types';
import {
  buildLoanAccountSummaryMatrix,
  formatLoanAccountDate,
  formatLoanChargeStatus,
  formatLoanTransactionType,
  isLoanTransactionAccrual,
  loanAccountCurrencyCode,
  loanAccountHasChargebackTransaction,
  loanAccountHasPayoutConfiguration,
  loanAccountHasSummary,
  loanAccountLinkedAccountId,
  loanAccountLinkedAccountLabel,
  loanAccountProductName,
  loanAccountRepaymentFrequencyLabel,
  loanAccountShowApprovedAmount,
  loanAccountShowDisbursedAmount,
  loanAccountStandingInstructionAtDisbursementLabel,
  loanTransactionDate,
  loanTransactionRowClassName,
  type LoanAccountSectionId
} from '@/lib/fineract/loan-account-display';
import { cn } from '@/lib/utils';

function LoanAccountSummaryMatrix({
  account,
  rows
}: {
  account: FineractLoanAccountDetail;
  rows: LoanAccountSummaryMatrixRow[];
}) {
  const currency = loanAccountCurrencyCode(account);
  const showAdjustments = loanAccountHasChargebackTransaction(account);

  const columns = showAdjustments
    ? (['Original', 'Adjustments', 'Paid', 'Waived', 'Written off', 'Outstanding', 'Over due'] as const)
    : (['Original', 'Paid', 'Waived', 'Written off', 'Outstanding', 'Over due'] as const);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[8rem]">Component</TableHead>
            {columns.map((column) => (
              <TableHead key={column} className="text-right">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.property}>
              <TableCell className="font-medium">{row.property}</TableCell>
              <TableCell className="text-right tabular-nums">
                <MoneyValue amount={row.original} currencyCode={currency} />
              </TableCell>
              {showAdjustments ? (
                <TableCell className="text-right tabular-nums">
                  <MoneyValue amount={row.adjustment} currencyCode={currency} />
                </TableCell>
              ) : null}
              <TableCell className="text-right tabular-nums">
                <MoneyValue amount={row.paid} currencyCode={currency} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <MoneyValue amount={row.waived} currencyCode={currency} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <MoneyValue amount={row.writtenOff} currencyCode={currency} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <MoneyValue amount={row.outstanding} currencyCode={currency} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <MoneyValue amount={row.overdue} currencyCode={currency} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LoanAccountPayoutSetupSection({ account }: { account: FineractLoanAccountDetail }) {
  if (!loanAccountHasPayoutConfiguration(account)) {
    return null;
  }

  const currency = loanAccountCurrencyCode(account);
  const linkedLabel = loanAccountLinkedAccountLabel(account);
  const linkedAccountId = loanAccountLinkedAccountId(account);
  const standingInstructionLabel = loanAccountStandingInstructionAtDisbursementLabel(account);
  const disbursementDetails = account.disbursementDetails ?? [];
  const clientId = account.clientId != null ? String(account.clientId) : undefined;
  const linkedHref =
    clientId && linkedAccountId
      ? clientAccountGeneralPath(clientId, 'savings', linkedAccountId)
      : undefined;

  return (
    <DetailSection title="Repayment setup">
      <DetailFieldGrid>
        {linkedLabel ? (
          <DetailField label="Linked savings account">
            {linkedHref ? (
              <Link href={linkedHref} className="font-medium text-primary hover:underline">
                {linkedLabel}
              </Link>
            ) : (
              linkedLabel
            )}
          </DetailField>
        ) : null}
        <DetailField label="Standing instruction at disbursement">
          {standingInstructionLabel}
        </DetailField>
      </DetailFieldGrid>

      {disbursementDetails.length ? (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-3 text-sm font-medium">Planned disbursements</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expected date</TableHead>
                <TableHead>Disbursed date</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Net disbursal</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disbursementDetails.map((row, index) => (
                <LoanAccountDisbursementDetailRow
                  key={row.id ?? `disbursement-${index}`}
                  row={row}
                  currency={currency}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </DetailSection>
  );
}

function LoanAccountDisbursementDetailRow({
  row,
  currency
}: {
  row: FineractLoanAccountDisbursementDetail;
  currency: string;
}) {
  return (
    <TableRow>
      <TableCell>{formatLoanAccountDate(row.expectedDisbursementDate)}</TableCell>
      <TableCell>{formatLoanAccountDate(row.actualDisbursementDate)}</TableCell>
      <TableCell className="text-right tabular-nums">
        <MoneyValue amount={row.principal} currencyCode={currency} />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <MoneyValue amount={row.netDisbursalAmount} currencyCode={currency} />
      </TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground">
        {row.note?.trim() || '—'}
      </TableCell>
    </TableRow>
  );
}

function LoanAccountSummarySection({ account }: { account: FineractLoanAccountDetail }) {
  const currency = loanAccountCurrencyCode(account);
  const summary = account.summary;
  const timeline = account.timeline;
  const matrixRows = buildLoanAccountSummaryMatrix(account);

  const kpiItems = summary
    ? [
        {
          id: 'balance',
          label: 'Current balance',
          value: (
            <MoneyValue amount={summary.totalOutstanding} currencyCode={currency} emphasize />
          )
        },
        {
          id: 'arrears',
          label: 'Arrears',
          value: <MoneyValue amount={summary.totalOverdue} currencyCode={currency} />
        },
        {
          id: 'repaid',
          label: 'Total repaid',
          value: <MoneyValue amount={summary.totalRepayment} currencyCode={currency} />
        },
        {
          id: 'overpaid',
          label: 'Overpaid',
          value: <MoneyValue amount={account.totalOverpaid} currencyCode={currency} />
        }
      ]
    : [
        {
          id: 'proposed',
          label: 'Proposed amount',
          value: (
            <MoneyValue amount={account.proposedPrincipal} currencyCode={currency} emphasize />
          )
        },
        ...(loanAccountShowApprovedAmount(account)
          ? [
              {
                id: 'approved',
                label: 'Approved amount',
                value: (
                  <MoneyValue amount={account.approvedPrincipal} currencyCode={currency} />
                )
              }
            ]
          : []),
        ...(loanAccountShowDisbursedAmount(account)
          ? [
              {
                id: 'principal',
                label: 'Disburse amount',
                value: <MoneyValue amount={account.principal} currencyCode={currency} />
              }
            ]
          : [])
      ];

  const timelineRows = [
    { label: 'Submitted', date: timeline?.submittedOnDate, by: timeline?.submittedByUsername },
    { label: 'Approved', date: timeline?.approvedOnDate, by: timeline?.approvedByUsername },
    {
      label: 'Disbursed',
      date: timeline?.actualDisbursementDate,
      by: timeline?.disbursedByUsername
    },
    { label: 'Expected maturity', date: timeline?.expectedMaturityDate },
    { label: 'Closed', date: timeline?.closedOnDate, by: timeline?.closedByUsername }
  ].filter((row) => row.date);

  return (
    <div className="space-y-6">
      <DetailSummary items={kpiItems} />

      {loanAccountHasSummary(account) ? (
        <>
          <DetailSection title="Performance history">
            <DetailFieldGrid>
              <DetailField label="Number of repayments">
                {account.numberOfRepayments ?? '—'}
              </DetailField>
              <DetailField label="Maturity date">
                {formatLoanAccountDate(timeline?.expectedMaturityDate)}
              </DetailField>
            </DetailFieldGrid>
          </DetailSection>

          {matrixRows.length ? (
            <DetailSection title="Loan summary">
              <LoanAccountSummaryMatrix account={account} rows={matrixRows} />
            </DetailSection>
          ) : null}
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Loan details">
          <DetailFieldGrid>
            <DetailField label="Product">{loanAccountProductName(account)}</DetailField>
            <DetailField label="Account no.">{account.accountNo}</DetailField>
            <DetailField label="Status">{account.status.value ?? '—'}</DetailField>
            <DetailField label="External ID">{account.externalId?.trim() || '—'}</DetailField>
            <DetailField label="Currency">
              {account.currency.name ?? currency} ({currency})
            </DetailField>
            <DetailField label="Branch">{account.officeName ?? '—'}</DetailField>
            <DetailField label="Loan officer">{account.loanOfficerName ?? 'Unassigned'}</DetailField>
            <DetailField label="Loan purpose">{account.loanPurposeName ?? '—'}</DetailField>
            <DetailField label="Disbursement date">
              {formatLoanAccountDate(timeline?.actualDisbursementDate)}
            </DetailField>
            {account.proposedPrincipal != null ? (
              <DetailField label="Proposed amount">
                <MoneyValue amount={account.proposedPrincipal} currencyCode={currency} />
              </DetailField>
            ) : null}
            {loanAccountShowApprovedAmount(account) && account.approvedPrincipal != null ? (
              <DetailField label="Approved amount">
                <MoneyValue amount={account.approvedPrincipal} currencyCode={currency} />
              </DetailField>
            ) : null}
            {loanAccountShowDisbursedAmount(account) && account.principal != null ? (
              <DetailField label="Disburse amount">
                <MoneyValue amount={account.principal} currencyCode={currency} />
              </DetailField>
            ) : null}
            {account.writeOffReason ? (
              <DetailField label="Write-off reason">{account.writeOffReason}</DetailField>
            ) : null}
            {summary?.overdueSinceDate && account.inArrears ? (
              <DetailField label="Arrears since">
                {formatLoanAccountDate(summary.overdueSinceDate)}
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
                    {formatLoanAccountDate(row.date)}
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

      <LoanAccountPayoutSetupSection account={account} />

      {account.transactionProcessingStrategyName ||
      account.amortizationType ||
      account.interestType ||
      account.numberOfRepayments != null ? (
        <DetailSection title="Loan terms">
          <DetailFieldGrid>
            {account.transactionProcessingStrategyName ? (
              <DetailField label="Repayment strategy">
                {account.transactionProcessingStrategyName}
              </DetailField>
            ) : null}
            {account.amortizationType ? (
              <DetailField label="Amortization">
                {enumOptionLabel(account.amortizationType) ?? '—'}
              </DetailField>
            ) : null}
            {account.numberOfRepayments != null ? (
              <DetailField label="Repayments">{account.numberOfRepayments}</DetailField>
            ) : null}
            {account.repaymentEvery != null || account.repaymentFrequencyType ? (
              <DetailField label="Repayment frequency">
                {loanAccountRepaymentFrequencyLabel(account)}
              </DetailField>
            ) : null}
            {account.interestType ? (
              <DetailField label="Interest type">
                {enumOptionLabel(account.interestType) ?? '—'}
              </DetailField>
            ) : null}
            {account.interestRatePerPeriod != null ? (
              <DetailField label="Interest rate per period">
                {account.interestRatePerPeriod}%
              </DetailField>
            ) : null}
            {account.annualInterestRate != null ? (
              <DetailField label="Annual interest rate">{account.annualInterestRate}%</DetailField>
            ) : null}
            {account.interestCalculationPeriodType ? (
              <DetailField label="Interest calculation period">
                {enumOptionLabel(account.interestCalculationPeriodType) ?? '—'}
              </DetailField>
            ) : null}
          </DetailFieldGrid>
        </DetailSection>
      ) : null}
    </div>
  );
}

function LoanAccountScheduleSection({
  account,
  reportOrgName
}: {
  account: FineractLoanAccountDetail;
  reportOrgName: string;
}) {
  const schedule = account.repaymentSchedule;

  return (
    <LoanAccountSchedulePreview
      schedule={schedule ?? null}
      layout="page"
      canPreview={Boolean(schedule)}
      idleMessage="No repayment schedule is available for this loan."
      exportContext={
        schedule
          ? {
              account,
              reportOrgName
            }
          : undefined
      }
    />
  );
}

type TransactionRow = FineractLoanAccountTransaction;

function TransactionCell({
  transaction,
  children
}: {
  transaction: TransactionRow;
  children: ReactNode;
}) {
  return <span className={cn(loanTransactionRowClassName(transaction))}>{children}</span>;
}

function filterLoanTransactions(
  transactions: TransactionRow[],
  hideReversed: boolean,
  hideAccruals: boolean
): TransactionRow[] {
  return transactions.filter((transaction) => {
    if (hideReversed && transaction.reversed) {
      return false;
    }
    if (hideAccruals && isLoanTransactionAccrual(transaction)) {
      return false;
    }
    return true;
  });
}

function buildTransactionColumns(
  account: FineractLoanAccountDetail,
  clientId: string
): ColumnDef<TransactionRow>[] {
  const currency = loanAccountCurrencyCode(account);

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
            href={loanAccountTransactionPath(clientId, account.id, row.original.id)}
            className="tabular-nums text-primary underline-offset-4 hover:underline"
          >
            {row.original.id}
          </Link>
        </TransactionCell>
      )
    },
    {
      id: 'office',
      header: 'Office',
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          {row.original.officeName ?? '—'}
        </TransactionCell>
      )
    },
    {
      id: 'date',
      header: 'Transaction date',
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          {formatLoanAccountDate(loanTransactionDate(row.original))}
        </TransactionCell>
      )
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          {formatLoanTransactionType(row.original)}
        </TransactionCell>
      )
    },
    {
      id: 'amount',
      header: () => <span className="block w-full text-right">Amount</span>,
      cell: ({ row }) => (
        <TransactionCell transaction={row.original}>
          <span className="block w-full text-right tabular-nums">
            <MoneyValue amount={row.original.amount} currencyCode={currency} />
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
            <MoneyValue amount={row.original.outstandingLoanBalance} currencyCode={currency} />
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
        ) : isLoanTransactionAccrual(row.original) ? (
          <Badge variant="outline">Accrual</Badge>
        ) : (
          <Badge variant="secondary">Posted</Badge>
        )
    }
  ];
}

function LoanAccountTransactionsSection({
  account,
  clientId
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
}) {
  const [hideReversed, setHideReversed] = useState(false);
  const [hideAccruals, setHideAccruals] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });

  const allRows = useMemo(() => {
    const transactions = account.transactions ?? [];
    return [...transactions].sort((a, b) => b.id - a.id);
  }, [account.transactions]);

  const rows = useMemo(
    () => filterLoanTransactions(allRows, hideReversed, hideAccruals),
    [allRows, hideAccruals, hideReversed]
  );

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [hideAccruals, hideReversed]);

  const columns = useMemo(() => buildTransactionColumns(account, clientId), [account, clientId]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <DetailSection title="Transactions">
      {allRows.length ? (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="loan-hide-reversed"
              checked={hideReversed}
              onCheckedChange={(checked) => setHideReversed(checked === true)}
            />
            <Label htmlFor="loan-hide-reversed" className="cursor-pointer text-sm font-normal">
              Hide reversed
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="loan-hide-accruals"
              checked={hideAccruals}
              onCheckedChange={(checked) => setHideAccruals(checked === true)}
            />
            <Label htmlFor="loan-hide-accruals" className="cursor-pointer text-sm font-normal">
              Hide accruals
            </Label>
          </div>
        </div>
      ) : null}
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No transactions yet."
        emptyDescription="Disbursements, repayments, and fee postings will appear here."
      />
      {rows.length > 0 ? (
        <div className="mt-4">
          <DataTablePagination table={table} totalRecords={rows.length} />
        </div>
      ) : null}
    </DetailSection>
  );
}

type ChargeRow = FineractLoanAccountCharge;

function buildChargeColumns(account: FineractLoanAccountDetail): ColumnDef<ChargeRow>[] {
  const currency = loanAccountCurrencyCode(account);

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
      cell: ({ row }) => formatLoanAccountDate(row.original.dueDate)
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
      cell: ({ row }) => formatLoanChargeStatus(row.original)
    }
  ];
}

function LoanAccountChargesSection({ account }: { account: FineractLoanAccountDetail }) {
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
        emptyMessage="No charges on this loan."
      />
    </DetailSection>
  );
}

export function LoanAccountSectionPanel({
  section,
  account,
  clientId,
  reportOrgName,
  standingInstructions = null,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords
}: {
  section: LoanAccountSectionId;
  account: FineractLoanAccountDetail;
  clientId: string;
  reportOrgName: string;
  standingInstructions?: LoanAccountStandingInstructionContext | null;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
}) {
  switch (section) {
    case 'summary':
      return <LoanAccountSummarySection account={account} />;
    case 'schedule':
      return <LoanAccountScheduleSection account={account} reportOrgName={reportOrgName} />;
    case 'transactions':
      return <LoanAccountTransactionsSection account={account} clientId={clientId} />;
    case 'charges':
      return <LoanAccountChargesSection account={account} />;
    case 'audit':
      return canViewAudits ? (
        <LoanAccountAuditView
          audits={auditEntries}
          loadFailed={auditLoadFailed}
          totalRecords={auditTotalRecords}
        />
      ) : null;
    case 'standingInstructions':
      return standingInstructions ? (
        <LoanAccountStandingInstructionsSection
          account={account}
          clientId={clientId}
          clientName={standingInstructions.clientName}
          fromOfficeId={standingInstructions.fromOfficeId}
          initialItems={standingInstructions.items}
          createTemplate={standingInstructions.createTemplate}
          permissions={standingInstructions.permissions}
          canCreate={standingInstructions.canCreate}
          createFormDefaults={standingInstructions.createFormDefaults}
        />
      ) : null;
    default:
      return null;
  }
}

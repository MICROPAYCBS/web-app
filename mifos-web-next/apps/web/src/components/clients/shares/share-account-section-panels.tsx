'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractAuditTrailListItem,
  FineractShareAccountDetail
} from '@mifos/api-client';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { ScrollText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AuditTrailEntryList } from '@/components/audit/audit-trail-entry-list';
import {
  DetailField,
  DetailFieldGrid,
  DetailSection,
  DetailSummary,
  EmptyState,
  MoneyValue
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { formatTimelineActorByRole } from '@/lib/fineract/account-timeline-display';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';
import {
  formatShareAccountDate,
  shareAccountCurrencyCode,
  type ShareAccountSectionId
} from '@/lib/fineract/share-account-display';
import { sharePurchaseFundingLabel } from '@/lib/fineract/share-account-use-savings';

function ShareAccountSummarySection({ account }: { account: FineractShareAccountDetail }) {
  const currency = shareAccountCurrencyCode(account);
  const summary = account.summary;
  const timeline = account.timeline;

  const kpiItems = [
    {
      id: 'approved',
      label: 'Approved shares',
      value: (
        <span className="text-2xl font-semibold tabular-nums">
          {summary?.totalApprovedShares ?? 0}
        </span>
      )
    },
    {
      id: 'pending',
      label: 'Pending approval',
      value: (
        <span className="text-2xl font-semibold tabular-nums">
          {summary?.totalPendingForApprovalShares ?? 0}
        </span>
      )
    },
    {
      id: 'market',
      label: 'Current market price',
      value: <MoneyValue amount={account.currentMarketPrice} currencyCode={currency} emphasize />
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
      date: timeline?.approvedDate,
      by: formatTimelineActorByRole(timeline, 'approved')
    },
    {
      label: 'Activated',
      date: timeline?.activatedDate,
      by: formatTimelineActorByRole(timeline, 'activated')
    },
    {
      label: 'Rejected',
      date: timeline?.rejectedDate,
      by: formatTimelineActorByRole(timeline, 'rejected')
    },
    {
      label: 'Closed',
      date: timeline?.closedDate,
      by: formatTimelineActorByRole(timeline, 'closed')
    }
  ].filter((row) => row.date != null);

  return (
    <div className="space-y-6">
      <DetailSummary items={kpiItems} />
      <DetailSection title="Account">
        <DetailFieldGrid>
          <DetailField label="Account number">{account.accountNo}</DetailField>
          <DetailField label="External ID">{account.externalId || '—'}</DetailField>
          <DetailField label="Product">{account.productName || '—'}</DetailField>
          <DetailField label="Currency">{currency}</DetailField>
          <DetailField label="Linked savings">
            {account.savingsAccountNumber
              ? account.savingsAccountNumber
              : account.savingsAccountId
                ? `#${account.savingsAccountId}`
                : '—'}
          </DetailField>
          <DetailField label="Allow dividends when inactive">
            {account.allowDividendCalculationForInactiveClients ? 'Yes' : 'No'}
          </DetailField>
          <DetailField label="Lock-in period">
            {account.lockinPeriod != null
              ? `${account.lockinPeriod} ${enumOptionLabel(account.lockPeriodTypeEnum) || ''}`.trim()
              : '—'}
          </DetailField>
          <DetailField label="Minimum active period">
            {account.minimumActivePeriod != null
              ? `${account.minimumActivePeriod} ${enumOptionLabel(account.minimumActivePeriodTypeEnum) || ''}`.trim()
              : '—'}
          </DetailField>
        </DetailFieldGrid>
      </DetailSection>
      {timelineRows.length ? (
        <DetailSection title="Timeline">
          <DetailFieldGrid>
            {timelineRows.map((row) => (
              <DetailField key={row.label} label={row.label}>
                {`${formatShareAccountDate(row.date)}${row.by ? ` · ${row.by}` : ''}`}
              </DetailField>
            ))}
          </DetailFieldGrid>
        </DetailSection>
      ) : null}
    </div>
  );
}

function ShareAccountPurchasesSection({ account }: { account: FineractShareAccountDetail }) {
  const currency = shareAccountCurrencyCode(account);
  const rows = account.purchasedShares ?? [];
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      {
        accessorKey: 'purchasedDate',
        header: 'Date',
        cell: ({ row }) => formatShareAccountDate(row.original.purchasedDate)
      },
      {
        accessorKey: 'numberOfShares',
        header: 'Shares',
        cell: ({ row }) => row.original.numberOfShares ?? '—'
      },
      {
        accessorKey: 'purchasedPrice',
        header: 'Unit price',
        cell: ({ row }) => (
          <MoneyValue amount={row.original.purchasedPrice} currencyCode={currency} />
        )
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <MoneyValue amount={row.original.amount} currencyCode={currency} />
      },
      {
        id: 'funding',
        header: 'Funding',
        cell: ({ row }) => sharePurchaseFundingLabel(row.original.useSavings)
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => enumOptionLabel(row.original.status) || '—'
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => enumOptionLabel(row.original.type) || '—'
      }
    ],
    [currency]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  if (!rows.length) {
    return (
      <EmptyState
        title="No purchased shares"
        description="There are no share purchases on this account yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataTable table={table} />
      <DataTablePagination table={table} totalRecords={rows.length} />
    </div>
  );
}

function ShareAccountChargesSection({ account }: { account: FineractShareAccountDetail }) {
  const currency = shareAccountCurrencyCode(account);
  const rows = account.charges ?? [];

  if (!rows.length) {
    return (
      <EmptyState title="No charges" description="This share account has no charges." />
    );
  }

  return (
    <DetailSection title="Charges">
      <div className="space-y-3">
        {rows.map((charge) => (
          <div
            key={charge.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border px-4 py-3"
          >
            <div>
              <p className="font-medium">{charge.name}</p>
              <p className="text-sm text-muted-foreground">
                {enumOptionLabel(charge.chargeTimeType) || 'Charge'}
                {charge.chargeCalculationType
                  ? ` · ${enumOptionLabel(charge.chargeCalculationType)}`
                  : ''}
              </p>
            </div>
            <div className="text-right text-sm">
              <MoneyValue amount={charge.amount} currencyCode={currency} />
              {charge.amountOutstanding != null ? (
                <p className="text-muted-foreground">
                  Outstanding{' '}
                  <MoneyValue amount={charge.amountOutstanding} currencyCode={currency} />
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

function ShareAccountDividendsSection({ account }: { account: FineractShareAccountDetail }) {
  const currency = shareAccountCurrencyCode(account);
  const rows = account.dividends ?? [];

  if (!rows.length) {
    return (
      <EmptyState
        title="No dividends"
        description="No dividends have been posted to this share account."
      />
    );
  }

  return (
    <DetailSection title="Dividends">
      <div className="space-y-3">
        {rows.map((dividend) => (
          <div
            key={dividend.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border px-4 py-3"
          >
            <div>
              <p className="font-medium">{formatShareAccountDate(dividend.postedDate)}</p>
              <p className="text-sm text-muted-foreground">
                {enumOptionLabel(dividend.status) || 'Dividend'}
              </p>
            </div>
            <MoneyValue amount={dividend.amount} currencyCode={currency} />
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

function ShareAccountAuditSection({
  audits,
  loadFailed,
  totalRecords
}: {
  audits: FineractAuditTrailListItem[];
  loadFailed?: boolean;
  totalRecords?: number;
}) {
  if (loadFailed) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Audit trail unavailable"
        description="Audit entries could not be loaded for this share account."
      />
    );
  }

  if (audits.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No audit entries"
        description="No audit trail entries were found for this share account."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing {audits.length}
        {totalRecords != null && totalRecords > audits.length ? ` of ${totalRecords}` : ''} audit{' '}
        {audits.length === 1 ? 'entry' : 'entries'}, newest first.
      </p>
      <AuditTrailEntryList audits={audits} />
    </div>
  );
}

export function ShareAccountSectionPanel({
  section,
  account,
  canViewAudits = false,
  auditEntries = [],
  auditLoadFailed = false,
  auditTotalRecords
}: {
  section: ShareAccountSectionId;
  account: FineractShareAccountDetail;
  canViewAudits?: boolean;
  auditEntries?: FineractAuditTrailListItem[];
  auditLoadFailed?: boolean;
  auditTotalRecords?: number;
}) {
  switch (section) {
    case 'summary':
      return <ShareAccountSummarySection account={account} />;
    case 'purchases':
      return <ShareAccountPurchasesSection account={account} />;
    case 'charges':
      return <ShareAccountChargesSection account={account} />;
    case 'dividends':
      return <ShareAccountDividendsSection account={account} />;
    case 'audit':
      return canViewAudits ? (
        <ShareAccountAuditSection
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

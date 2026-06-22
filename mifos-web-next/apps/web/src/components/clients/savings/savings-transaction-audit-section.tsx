'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DetailField, DetailFieldGrid, DetailSection } from '@/components/composites';
import { formatAuditTrailDateTime } from '@/lib/fineract/audit-trail-display';

function auditTrailDetailPath(auditId: number): string {
  return `/system/audit-trails/${auditId}`;
}

function AuditTrailSummary({ audit }: { audit: FineractAuditTrailListItem }) {
  return (
    <DetailFieldGrid>
      <DetailField label="Audit ID">
        <Link
          href={auditTrailDetailPath(audit.id)}
          className="tabular-nums text-primary underline-offset-4 hover:underline"
        >
          {audit.id}
        </Link>
      </DetailField>
      <DetailField label="Made on">{formatAuditTrailDateTime(audit.madeOnDate)}</DetailField>
      <DetailField label="User">{audit.maker ?? '—'}</DetailField>
      <DetailField label="Action">{audit.actionName ?? '—'}</DetailField>
      <DetailField label="Result">{audit.processingResult ?? '—'}</DetailField>
      {audit.checker ? <DetailField label="Checker">{audit.checker}</DetailField> : null}
      {audit.checkedOnDate ? (
        <DetailField label="Checked on">
          {formatAuditTrailDateTime(audit.checkedOnDate)}
        </DetailField>
      ) : null}
      {audit.ip ? <DetailField label="Client IP">{audit.ip}</DetailField> : null}
    </DetailFieldGrid>
  );
}

function buildAuditColumns(): ColumnDef<FineractAuditTrailListItem>[] {
  return [
    {
      accessorKey: 'id',
      header: 'Audit ID',
      cell: ({ row }) => (
        <Link
          href={auditTrailDetailPath(row.original.id)}
          className="tabular-nums text-primary underline-offset-4 hover:underline"
        >
          {row.original.id}
        </Link>
      )
    },
    {
      accessorKey: 'madeOnDate',
      header: 'Made on',
      cell: ({ row }) => formatAuditTrailDateTime(row.original.madeOnDate)
    },
    {
      accessorKey: 'maker',
      header: 'User',
      cell: ({ row }) => row.original.maker ?? '—'
    },
    {
      accessorKey: 'actionName',
      header: 'Action',
      cell: ({ row }) => row.original.actionName ?? '—'
    },
    {
      accessorKey: 'processingResult',
      header: 'Result',
      cell: ({ row }) => row.original.processingResult ?? '—'
    },
    {
      accessorKey: 'checker',
      header: 'Checker',
      cell: ({ row }) => row.original.checker ?? '—'
    },
    {
      accessorKey: 'checkedOnDate',
      header: 'Checked on',
      cell: ({ row }) =>
        row.original.checkedOnDate
          ? formatAuditTrailDateTime(row.original.checkedOnDate)
          : '—'
    },
    {
      accessorKey: 'ip',
      header: 'Client IP',
      cell: ({ row }) => row.original.ip ?? '—'
    }
  ];
}

function AuditTrailTable({ audits }: { audits: FineractAuditTrailListItem[] }) {
  const columns = useMemo(() => buildAuditColumns(), []);
  const table = useReactTable({
    data: audits,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DataTable table={table} stickyHeader={false} emptyMessage="No audit entries." />
  );
}

export function SavingsTransactionAuditSection({
  audits,
  loadFailed = false
}: {
  audits: FineractAuditTrailListItem[];
  loadFailed?: boolean;
}) {
  if (loadFailed) {
    return (
      <DetailSection title="Audit trail">
        <p className="text-sm text-muted-foreground">
          Audit trail entries could not be loaded for this transaction.
        </p>
      </DetailSection>
    );
  }

  if (audits.length === 0) {
    return (
      <DetailSection title="Audit trail">
        <p className="text-sm text-muted-foreground">
          No audit trail entries were found for this transaction.
        </p>
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Audit trail">
      {audits.length === 1 ? (
        <AuditTrailSummary audit={audits[0]} />
      ) : (
        <AuditTrailTable audits={audits} />
      )}
    </DetailSection>
  );
}

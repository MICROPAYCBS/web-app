'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailDetail } from '@mifos/api-client';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { useMemo } from 'react';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import {
  formatAuditTrailDateTime,
  parseAuditTrailCommands
} from '@/lib/fineract/audit-trail-display';

export function AuditTrailDetailView({ audit }: { audit: FineractAuditTrailDetail }) {
  const commands = useMemo(() => parseAuditTrailCommands(audit.commandAsJson), [audit.commandAsJson]);

  const columns = useMemo<ColumnDef<{ command: string; commandValue: string }>[]>(
    () => [
      { accessorKey: 'command', header: 'Command' },
      { accessorKey: 'commandValue', header: 'Command value' }
    ],
    []
  );

  const table = useReactTable({
    data: commands,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DetailPage
      header={
        <DetailHeader
          backLink={<DetailBackLink href="/system/audit-trails" label="Back to audit trails" />}
          title={`Audit trail ${audit.id}`}
          meta={audit.actionName ? `${audit.actionName} on ${audit.entityName ?? 'resource'}` : undefined}
        />
      }
      summary={
        <DetailFieldGrid columns={2}>
          <DetailField label="Status">{audit.processingResult ?? '—'}</DetailField>
          <DetailField label="User">{audit.maker ?? '—'}</DetailField>
          <DetailField label="Action">{audit.actionName ?? '—'}</DetailField>
          <DetailField label="Entity">{audit.entityName ?? '—'}</DetailField>
          <DetailField label="Resource ID">{audit.resourceId ?? '—'}</DetailField>
          <DetailField label="Made date">{formatAuditTrailDateTime(audit.madeOnDate)}</DetailField>
          {audit.officeName ? <DetailField label="Office">{audit.officeName}</DetailField> : null}
          {audit.checker ? <DetailField label="Checker">{audit.checker}</DetailField> : null}
          {audit.checkedOnDate ? (
            <DetailField label="Checked date">
              {formatAuditTrailDateTime(audit.checkedOnDate)}
            </DetailField>
          ) : null}
          {audit.savingsAccountNo ? (
            <DetailField label="Savings account">{audit.savingsAccountNo}</DetailField>
          ) : null}
          {audit.groupLevelName ? (
            <DetailField label="Group level">{audit.groupLevelName}</DetailField>
          ) : null}
          {audit.ip ? <DetailField label="Client IP">{audit.ip}</DetailField> : null}
        </DetailFieldGrid>
      }
    >
      <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium">Command payload</h3>
        {commands.length ? (
          <DataTable
            table={table}
            stickyHeader={false}
            emptyMessage="No command fields"
            emptyDescription="This audit entry has no parsed command payload."
          />
        ) : (
          <p className="text-sm text-muted-foreground">No command payload available for this entry.</p>
        )}
      </div>
    </DetailPage>
  );
}

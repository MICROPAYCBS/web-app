'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractLoanRescheduleRequest } from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import {
  LoanAccountRescheduleDecisionDialog,
  type LoanRescheduleDecisionKind
} from '@/components/clients/loan-account/actions/loan-account-reschedule-decision-dialog';
import { LoanAccountRescheduleSheet } from '@/components/clients/loan-account/actions/loan-account-reschedule-sheet';
import { DetailSection } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  loanRescheduleStatusLabel,
  loanRescheduleStatusVariant
} from '@/lib/fineract/loan-reschedule-display';

export type LoanAccountRescheduleContext = {
  requests: FineractLoanRescheduleRequest[];
  canCreate: boolean;
  canApprove: boolean;
  canReject: boolean;
};

export function LoanAccountReschedulesSection({
  account,
  clientId,
  context
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  context: LoanAccountRescheduleContext;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [decisionKind, setDecisionKind] = useState<LoanRescheduleDecisionKind | null>(null);
  const [decisionRequestId, setDecisionRequestId] = useState<number | null>(null);

  const columns = useMemo<ColumnDef<FineractLoanRescheduleRequest>[]>(
    () => [
      {
        id: 'id',
        header: 'Request',
        accessorFn: (row) => row.id,
        cell: ({ row }) => <span className="tabular-nums">#{row.original.id}</span>
      },
      {
        id: 'fromDate',
        header: 'From date',
        accessorFn: (row) => row.rescheduleFromDate ?? '',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.rescheduleFromDate ?? '—'}</span>
        )
      },
      {
        id: 'reason',
        header: 'Reason',
        accessorFn: (row) => row.rescheduleReasonCodeValue?.name ?? '',
        cell: ({ row }) => row.original.rescheduleReasonCodeValue?.name ?? '—'
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={loanRescheduleStatusVariant(row.original.statusEnum)}>
            {loanRescheduleStatusLabel(row.original.statusEnum)}
          </Badge>
        )
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const pending = row.original.statusEnum?.pendingApproval === true;
          if (!pending) {
            return null;
          }
          return (
            <div className="flex flex-wrap gap-2">
              {context.canReject ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDecisionRequestId(row.original.id);
                    setDecisionKind('reject');
                  }}
                >
                  Reject
                </Button>
              ) : null}
              {context.canApprove ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDecisionRequestId(row.original.id);
                    setDecisionKind('approve');
                  }}
                >
                  Approve
                </Button>
              ) : null}
            </div>
          );
        }
      }
    ],
    [context.canApprove, context.canReject]
  );

  const table = useReactTable({
    data: context.requests,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <DetailSection
      title="Reschedules"
      actions={
        context.canCreate ? (
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            Reschedule
          </Button>
        ) : undefined
      }
    >
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No reschedule requests on this loan."
      />
      <LoanAccountRescheduleSheet
        clientId={clientId}
        account={account}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <LoanAccountRescheduleDecisionDialog
        clientId={clientId}
        accountId={account.id}
        requestId={decisionRequestId}
        kind={decisionKind}
        open={decisionKind != null && decisionRequestId != null}
        onOpenChange={(open) => {
          if (!open) {
            setDecisionKind(null);
            setDecisionRequestId(null);
          }
        }}
      />
    </DetailSection>
  );
}

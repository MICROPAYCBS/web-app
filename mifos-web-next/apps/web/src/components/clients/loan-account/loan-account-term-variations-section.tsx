'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import {
  createLoanInterestPauseAction,
  deleteLoanInterestPauseAction,
  updateLoanInterestPauseAction
} from '@/actions/loan-interest-pause';
import type { LoanAccountInterestPausesContext } from '@/components/clients/loan-account/loan-account-related-context';
import { DateField } from '@/components/composites/date-field';
import { DetailSection } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { FormSheet } from '@/components/composites/form-sheet';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import {
  formatLoanAccountDate,
  groupLoanTermVariations
} from '@/lib/fineract/loan-account-display';
import type {
  FineractLoanAccountDetail,
  FineractLoanTermVariation,
  LoanInterestPauseRecord
} from '@/lib/fineract/loan-account-types';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

function LoanAccountInterestPauseSheet({
  clientId,
  accountId,
  open,
  onOpenChange,
  editing
}: {
  clientId: string;
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: LoanInterestPauseRecord | null;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleOpenChange(next: boolean) {
    if (next) {
      setStartDate(fineractApiDateToFormString(editing?.startDate) ?? '');
      setEndDate(fineractApiDateToFormString(editing?.endDate) ?? '');
      setError(null);
      setFieldErrors({});
    }
    onOpenChange(next);
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = { startDate, endDate };
      const result = editing
        ? await updateLoanInterestPauseAction(clientId, accountId, editing.id, payload)
        : await createLoanInterestPauseAction(clientId, accountId, payload);
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={editing ? 'Edit interest pause' : 'Add interest pause'}
      description="No interest accrues between these dates."
      formId={formId}
      submitLabel={editing ? 'Save pause' : 'Add pause'}
      submitLoading={pending}
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <DateField
          label="Start date"
          required
          allowFuture
          value={startDate}
          onChange={(value) => setStartDate(value ?? '')}
          error={fieldErrors.startDate}
          disabled={pending}
        />
        <DateField
          label="End date"
          required
          allowFuture
          value={endDate}
          onChange={(value) => setEndDate(value ?? '')}
          error={fieldErrors.endDate}
          disabled={pending}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

function VariationTable({ rows }: { rows: FineractLoanTermVariation[] }) {
  const columns = useMemo<ColumnDef<FineractLoanTermVariation>[]>(
    () => [
      {
        id: 'from',
        header: 'From',
        cell: ({ row }) => formatLoanAccountDate(row.original.termVariationApplicableFrom)
      },
      {
        id: 'date',
        header: 'Date value',
        cell: ({ row }) => formatLoanAccountDate(row.original.dateValue)
      },
      {
        id: 'amount',
        header: () => <span className="block w-full text-right">Amount / rate</span>,
        cell: ({ row }) => (
          <span className="block w-full text-right tabular-nums">
            {row.original.decimalValue ?? '—'}
          </span>
        )
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => enumOptionLabel(row.original.termType) ?? '—'
      }
    ],
    []
  );
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  });
  return <DataTable table={table} stickyHeader={false} />;
}

export function LoanAccountTermVariationsSection({
  account,
  clientId,
  interestPauses
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  interestPauses: LoanAccountInterestPausesContext | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<LoanInterestPauseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanInterestPauseRecord | null>(null);
  const groups = groupLoanTermVariations(account.loanTermVariations ?? []);
  const pauseRows = interestPauses?.items ?? [];
  const canManage = Boolean(interestPauses?.canManage);

  const pauseColumns = useMemo<ColumnDef<LoanInterestPauseRecord>[]>(
    () => [
      {
        id: 'start',
        header: 'Start',
        cell: ({ row }) => formatLoanAccountDate(row.original.startDate)
      },
      {
        id: 'end',
        header: 'End',
        cell: ({ row }) => formatLoanAccountDate(row.original.endDate)
      },
      ...(canManage
        ? [
            {
              id: 'actions',
              header: 'Actions',
              cell: ({ row }) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(row.original);
                      setSheetOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(row.original)}
                  >
                    Remove
                  </Button>
                </div>
              )
            } satisfies ColumnDef<LoanInterestPauseRecord>
          ]
        : [])
    ],
    [canManage]
  );

  const pauseTable = useReactTable({
    data: pauseRows,
    columns: pauseColumns,
    getCoreRowModel: getCoreRowModel()
  });

  function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    startTransition(async () => {
      const result = await deleteLoanInterestPauseAction(clientId, account.id, deleteTarget.id);
      if (!result.ok) {
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <DetailSection
      title="Term variations"
      actions={
        canManage ? (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setSheetOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Add interest pause
          </Button>
        ) : undefined
      }
    >
      {groups.length === 0 && pauseRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No term variations on this loan.</p>
      ) : null}

      {groups
        .filter((group) => group.id !== 'interestPause')
        .map((group) => (
          <div key={group.id} className="mt-6 space-y-3">
            <p className="text-sm font-medium">{group.label}</p>
            <VariationTable rows={group.rows} />
          </div>
        ))}

      {canManage || pauseRows.length > 0 ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium">Interest pauses</p>
          <DataTable
            table={pauseTable}
            stickyHeader={false}
            emptyMessage="No interest pauses."
          />
        </div>
      ) : null}

      <LoanAccountInterestPauseSheet
        clientId={clientId}
        accountId={account.id}
        open={sheetOpen}
        onOpenChange={(next) => {
          if (!next) {
            setEditing(null);
          }
          setSheetOpen(next);
        }}
        editing={editing}
      />
      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove interest pause</DialogTitle>
            <DialogDescription>Interest will accrue again for this period.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailSection>
  );
}

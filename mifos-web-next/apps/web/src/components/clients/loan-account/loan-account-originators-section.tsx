'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import type { LoanOriginatorListItem } from '@mifos/api-client';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import {
  attachLoanOriginatorAction,
  detachLoanOriginatorAction,
  loadLoanOriginatorsForAttachAction
} from '@/actions/loan-originator-link';
import type { LoanAccountOriginatorsContext } from '@/components/clients/loan-account/loan-account-related-context';
import { DetailSection } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  formatLoanOriginatorStatus,
  loanOriginatorStatusVariant
} from '@/lib/fineract/loan-originator-display';

export function LoanAccountOriginatorSheet({
  clientId,
  accountId,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<LoanOriginatorListItem[]>([]);
  const [originatorId, setOriginatorId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function reset() {
    setOriginatorId('');
    setError(null);
    setFieldErrors({});
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadLoanOriginatorsForAttachAction(accountId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOptions(result.originators);
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, open]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await attachLoanOriginatorAction(clientId, accountId, {
        originatorId: Number(originatorId)
      });
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
      title="Attach originator"
      description="Link an originator to this loan before it is approved."
      formId={formId}
      submitLabel="Attach originator"
      submitLoading={pending || loading}
      submitDisabled={pending || loading}
      onSubmit={handleSubmit}
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <SelectField
          label="Originator"
          required
          value={originatorId}
          onValueChange={(next) => setOriginatorId(next ?? '')}
          options={toSelectOptions(options)}
          error={fieldErrors.originatorId}
          disabled={pending || loading}
          emptyMessage="No active originators available to attach."
        />
      </form>
    </FormSheet>
  );
}

export function LoanAccountOriginatorsSection({
  clientId,
  accountId,
  context,
  addOpen,
  onAddOpenChange
}: {
  clientId: string;
  accountId: number;
  context: LoanAccountOriginatorsContext;
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = addOpen ?? internalOpen;
  const setOpen = onAddOpenChange ?? setInternalOpen;
  const [deleteTarget, setDeleteTarget] = useState<LoanOriginatorListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<LoanOriginatorListItem>[]>(
    () => {
      const cols: ColumnDef<LoanOriginatorListItem>[] = [
        {
          accessorKey: 'id',
          header: 'ID',
          cell: ({ row }) => <span className="tabular-nums">#{row.original.id}</span>
        },
        {
          accessorKey: 'name',
          header: 'Name',
          cell: ({ row }) => row.original.name
        },
        {
          accessorKey: 'externalId',
          header: 'External ID',
          cell: ({ row }) => row.original.externalId?.trim() || '—'
        },
        {
          id: 'status',
          header: 'Status',
          cell: ({ row }) => (
            <Badge variant={loanOriginatorStatusVariant(row.original.status)}>
              {formatLoanOriginatorStatus(row.original.status)}
            </Badge>
          )
        },
        {
          id: 'originatorType',
          header: 'Originator type',
          cell: ({ row }) => row.original.originatorType?.name ?? '—'
        },
        {
          id: 'channelType',
          header: 'Channel type',
          cell: ({ row }) => row.original.channelType?.name ?? '—'
        }
      ];
      if (context.canDetach) {
        cols.push({
          id: 'actions',
          header: 'Actions',
          cell: ({ row }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(row.original)}
            >
              Remove
            </Button>
          )
        });
      }
      return cols;
    },
    [context.canDetach]
  );

  const table = useReactTable({
    data: context.items,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await detachLoanOriginatorAction(clientId, accountId, deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <DetailSection
      title="Originators"
      actions={
        context.canAttach ? (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Attach originator
          </Button>
        ) : undefined
      }
    >
      {actionError ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No originators on this loan."
        emptyDescription="Attach an originator before the loan is approved."
      />
      <LoanAccountOriginatorSheet
        clientId={clientId}
        accountId={accountId}
        open={open}
        onOpenChange={setOpen}
      />
      <Dialog
        open={deleteTarget != null}
        onOpenChange={(openDialog) => !openDialog && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove originator</DialogTitle>
            <DialogDescription>
              Remove originator <strong>{deleteTarget?.name}</strong> from this loan? You can attach
              it again while the application is pending.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDeleteConfirm}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailSection>
  );
}

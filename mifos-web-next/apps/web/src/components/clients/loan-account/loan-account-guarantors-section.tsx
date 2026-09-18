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
import { useId, useMemo, useState, useTransition, useEffect } from 'react';
import {
  createLoanGuarantorAction,
  deleteLoanGuarantorAction,
  loadLoanGuarantorTemplateAction,
  updateLoanGuarantorAction
} from '@/actions/loan-guarantor';
import type { LoanAccountGuarantorsContext } from '@/components/clients/loan-account/loan-account-related-context';
import { DetailSection } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
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
import type {
  FineractLoanAccountDetail,
  LoanGuarantorRecord,
  LoanGuarantorTypeOption
} from '@/lib/fineract/loan-account-types';

const FALLBACK_GUARANTOR_TYPES: LoanGuarantorTypeOption[] = [
  { id: 1, value: 'Existing customer' },
  { id: 3, value: 'Staff' },
  { id: 4, value: 'External entity' }
];

function isExternalType(typeId: number) {
  return typeId === 4;
}

function needsEntityId(typeId: number) {
  return typeId === 1 || typeId === 3;
}

export function LoanAccountGuarantorSheet({
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
  editing?: LoanGuarantorRecord | null;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<LoanGuarantorTypeOption[]>(FALLBACK_GUARANTOR_TYPES);
  const [guarantorTypeId, setGuarantorTypeId] = useState('1');
  const [entityId, setEntityId] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const typeId = Number(guarantorTypeId) || 1;

  function resetFrom(editingRow?: LoanGuarantorRecord | null) {
    setGuarantorTypeId(String(editingRow?.guarantorTypeId ?? 1));
    setEntityId(editingRow?.entityId != null ? String(editingRow.entityId) : '');
    setFirstname(editingRow?.firstname ?? '');
    setLastname(editingRow?.lastname ?? '');
    setError(null);
    setFieldErrors({});
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    resetFrom(editing);
    let cancelled = false;
    setLoading(true);
    void loadLoanGuarantorTemplateAction(accountId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (result.ok && result.guarantorTypeOptions.length) {
        setTypes(result.guarantorTypeOptions);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, editing, open]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        guarantorTypeId: typeId,
        entityId: entityId ? Number(entityId) : undefined,
        firstname,
        lastname
      };
      const result = editing
        ? await updateLoanGuarantorAction(clientId, accountId, editing.id, payload)
        : await createLoanGuarantorAction(clientId, accountId, payload);
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
      title={editing ? 'Edit guarantor' : 'Add guarantor'}
      description="Guarantee this loan with an existing customer, staff member, or an external person."
      formId={formId}
      submitLabel={editing ? 'Save guarantor' : 'Add guarantor'}
      submitLoading={pending}
      submitDisabled={loading}
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <SelectField
          label="Guarantor type"
          required
          value={guarantorTypeId}
          onValueChange={(next) => setGuarantorTypeId(next ?? '1')}
          options={toSelectOptions(types)}
          error={fieldErrors.guarantorTypeId}
          disabled={pending || loading}
        />
        {needsEntityId(typeId) ? (
          <NumericField
            label={typeId === 3 ? 'Staff ID' : 'Customer ID'}
            required
            integer
            value={entityId}
            onChange={setEntityId}
            error={fieldErrors.entityId}
            disabled={pending || loading}
          />
        ) : null}
        {isExternalType(typeId) ? (
          <>
            <TextField
              label="First name"
              required
              value={firstname}
              onChange={setFirstname}
              error={fieldErrors.firstname}
              disabled={pending || loading}
            />
            <TextField
              label="Last name"
              required
              value={lastname}
              onChange={setLastname}
              error={fieldErrors.lastname}
              disabled={pending || loading}
            />
          </>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

export function LoanAccountGuarantorsSection({
  account,
  clientId,
  context,
  addOpen,
  onAddOpenChange
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  context: LoanAccountGuarantorsContext;
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  const [editing, setEditing] = useState<LoanGuarantorRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanGuarantorRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const open = editing != null || (addOpen ?? internalOpen);
  const setOpen = (next: boolean) => {
    if (!next) {
      setEditing(null);
      onAddOpenChange?.(false);
      setInternalOpen(false);
      return;
    }
    if (onAddOpenChange && editing == null) {
      onAddOpenChange(true);
      return;
    }
    setInternalOpen(true);
  };

  const columns = useMemo<ColumnDef<LoanGuarantorRecord>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.displayName || '—'
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => row.original.guarantorTypeName ?? '—'
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.status ?? '—'
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {context.canUpdate ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(row.original);
                  setInternalOpen(true);
                }}
              >
                Edit
              </Button>
            ) : null}
            {context.canDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(row.original)}
              >
                Remove
              </Button>
            ) : null}
          </div>
        )
      }
    ],
    [context.canDelete, context.canUpdate]
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
      const result = await deleteLoanGuarantorAction(clientId, account.id, deleteTarget.id);
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
      title="Guarantors"
      actions={
        context.canCreate ? (
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add guarantor
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
        emptyMessage="No guarantors on this loan."
        emptyDescription="Add a guarantor to back this loan."
      />
      <LoanAccountGuarantorSheet
        clientId={clientId}
        accountId={account.id}
        open={open}
        onOpenChange={setOpen}
        editing={editing}
      />
      <Dialog open={deleteTarget != null} onOpenChange={(openDialog) => !openDialog && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove guarantor</DialogTitle>
            <DialogDescription>This guarantor will be removed from the loan.</DialogDescription>
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

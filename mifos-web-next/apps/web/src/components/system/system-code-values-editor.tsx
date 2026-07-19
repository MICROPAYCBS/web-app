'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCodeValue } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { formatActionErrorMessage, type UpsertCodeValueInput } from '@mifos/validation';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  createCodeValueAction,
  deleteCodeValueAction,
  updateCodeValueAction
} from '@/actions/system-code';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { SystemCodeValueFormSheet } from '@/components/system/system-code-value-form-sheet';
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

function codeValueIsActive(value: FineractCodeValue): boolean {
  return value.isActive ?? value.active ?? false;
}

function nextPosition(values: FineractCodeValue[]): number {
  if (values.length === 0) {
    return 0;
  }
  const max = values.reduce((highest, value) => {
    const position = value.position ?? 0;
    return Math.max(highest, position);
  }, -1);
  return max + 1;
}

export function SystemCodeValuesEditor({
  codeId,
  initialValues
}: {
  codeId: number;
  initialValues: FineractCodeValue[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FineractCodeValue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FineractCodeValue | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const defaultPosition = useMemo(() => nextPosition(values), [values]);

  function refresh() {
    router.refresh();
  }

  function openCreateSheet() {
    setEditTarget(null);
    setSheetOpen(true);
  }

  function openEditSheet(value: FineractCodeValue) {
    setEditTarget(value);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setEditTarget(null);
    }
  }

  async function handleSave(input: UpsertCodeValueInput, valueId?: number) {
    setActionError(null);
    if (valueId != null) {
      const result = await updateCodeValueAction(codeId, valueId, input);
      if (!result.ok) {
        return {
          ok: false as const,
          message: formatActionErrorMessage(result.message, result.fieldErrors),
          fieldErrors: result.fieldErrors
        };
      }
      refresh();
      return { ok: true as const };
    }

    const result = await createCodeValueAction(codeId, input);
    if (!result.ok) {
      return {
        ok: false as const,
        message: formatActionErrorMessage(result.message, result.fieldErrors),
        fieldErrors: result.fieldErrors
      };
    }
    refresh();
    return { ok: true as const };
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    startTransition(async () => {
      const result = await deleteCodeValueAction(codeId, deleteTarget.id);
      if (!result.ok) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      refresh();
    });
  }

  const addValueButton = (
    <Can permission="CREATE_CODEVALUE">
      <Button type="button" size="sm" onClick={openCreateSheet} disabled={pending}>
        <Plus className="mr-2 size-4" />
        Add value
      </Button>
    </Can>
  );

  const columns = useMemo<ColumnDef<FineractCodeValue>[]>(
    () => [
      {
        id: 'position',
        header: 'Position',
        cell: ({ row }) => row.original.position ?? 0
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
      },
      {
        id: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.description?.trim() || '—'}</span>
        )
      },
      {
        id: 'active',
        header: 'Active',
        cell: ({ row }) => {
          const active = codeValueIsActive(row.original);
          return (
            <Badge variant={active ? 'default' : 'secondary'}>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          );
        }
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Can permission="UPDATE_CODEVALUE">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Edit ${row.original.name}`}
                onClick={() => openEditSheet(row.original)}
                disabled={pending}
              >
                <Pencil className="size-4" />
              </Button>
            </Can>
            <Can permission="DELETE_CODEVALUE">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                aria-label={`Delete ${row.original.name}`}
                onClick={() => setDeleteTarget(row.original)}
                disabled={pending}
              >
                <Trash2 className="size-4" />
              </Button>
            </Can>
          </div>
        )
      }
    ],
    [pending]
  );

  const table = useReactTable({
    data: values,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-3">{addValueButton}</div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}

        <DataTable
          table={table}
          stickyHeader={false}
          emptyMessage="No values defined yet"
          emptyDescription="Add a code value to populate this lookup list."
          emptyAction={addValueButton}
        />
        {values.length > 0 ? (
          <DataTablePagination table={table} totalRecords={values.length} />
        ) : null}
      </div>

      <SystemCodeValueFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        value={editTarget ?? undefined}
        defaultPosition={defaultPosition}
        onSave={handleSave}
        submitLoading={pending}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete code value</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Remove "${deleteTarget.name}" from this code? This cannot be undone.`
                : null}
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

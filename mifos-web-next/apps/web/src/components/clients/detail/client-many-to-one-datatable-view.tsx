'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import { Pencil, Plus, Table2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  addClientDatatableRowAction,
  deleteClientDatatableRowsAction,
  updateClientDatatableRowAction
} from '@/actions/client-datatable';
import { ClientDatatableFormSheet } from '@/components/clients/shared/client-datatable-form-sheet';
import { DatatableRowKindBadge, DetailSection, EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  datatableRowToFormValues,
  formatDatatableCellValueForColumn,
  formatDatatableTableTitle,
  getManyToOneRowId,
  manyToOneDisplayColumns
} from '@/lib/fineract/client-datatable-utils';
import { getDatatableControlName, toDatatableDisplayLabel } from '@/lib/fineract/datatables';

type SheetMode = { kind: 'add' } | { kind: 'edit'; rowId: number; values: Record<string, unknown> };

type DatatableSaveResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function ClientManyToOneDatatableView({
  clientId,
  registeredTableName,
  columns,
  rows,
  canCreate,
  canDelete
}: {
  clientId: string;
  registeredTableName: string;
  columns: FineractDatatableColumnHeader[];
  rows: Record<string, unknown>[];
  canCreate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  const title = formatDatatableTableTitle(registeredTableName);
  const displayColumns = useMemo(() => manyToOneDisplayColumns(columns), [columns]);
  const selectableRows = rows
    .map((row, index) => ({ row, rowId: getManyToOneRowId(row), index }))
    .filter(
      (entry): entry is { row: Record<string, unknown>; rowId: number; index: number } =>
        entry.rowId != null
    );
  const displayOnlyRows = rows.filter((row) => getManyToOneRowId(row) == null);
  const allSelected =
    selectableRows.length > 0 && selectableRows.every((entry) => selectedRowIds.includes(entry.rowId));
  const hasSelection = selectedRowIds.length > 0;
  const showActionsColumn = canCreate || canDelete;

  function refresh() {
    router.refresh();
  }

  function toggleRow(rowId: number, checked: boolean) {
    setSelectedRowIds((current) => {
      const existing = new Set(current);
      if (checked) {
        existing.add(rowId);
      } else {
        existing.delete(rowId);
      }
      return [...existing];
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedRowIds(
      checked ? selectableRows.map((entry) => entry.rowId) : []
    );
  }

  function openAddSheet() {
    setSheetMode({ kind: 'add' });
    setSheetOpen(true);
  }

  function openEditSheet(row: Record<string, unknown>, rowId: number) {
    setSheetMode({
      kind: 'edit',
      rowId,
      values: datatableRowToFormValues(columns, row)
    });
    setSheetOpen(true);
  }

  async function handleSave(values: Record<string, unknown>): Promise<DatatableSaveResult> {
    if (!sheetMode) {
      return { ok: false, message: 'No row selected.' };
    }

    const result =
      sheetMode.kind === 'add'
        ? await addClientDatatableRowAction(clientId, registeredTableName, values)
        : await updateClientDatatableRowAction(
            clientId,
            registeredTableName,
            sheetMode.rowId,
            values
          );

    if (!result.ok) {
      return {
        ok: false,
        message: result.message,
        fieldErrors: result.fieldErrors
      };
    }
    refresh();
    return { ok: true };
  }

  function confirmDeleteSelected() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteClientDatatableRowsAction(
        clientId,
        registeredTableName,
        selectedRowIds
      );
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      setSelectedRowIds([]);
      refresh();
    });
  }

  const sheetTitle =
    sheetMode?.kind === 'edit' ? `Edit ${title}` : `Add ${title}`;
  const sheetValues = sheetMode?.kind === 'edit' ? sheetMode.values : {};
  const sheetKey = `${registeredTableName}-${sheetMode?.kind === 'edit' ? sheetMode.rowId : 'new'}`;

  return (
    <>
      {actionError ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <DetailSection
        title={title}
        titleAccessory={<DatatableRowKindBadge multiRow />}
        description="Multiple rows can be linked to this client."
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button type="button" size="sm" onClick={openAddSheet} disabled={pending}>
                <Plus className="mr-2 size-4" />
                Add row
              </Button>
            ) : null}
            {canDelete && hasSelection ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                disabled={pending}
              >
                <Trash2 className="mr-2 size-4" />
                Delete selected ({selectedRowIds.length})
              </Button>
            ) : null}
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState
            icon={Table2}
            title="No rows yet"
            description={`Add a row to ${title.toLowerCase()}.`}
            action={
              canCreate ? (
                <Button type="button" size="sm" onClick={openAddSheet}>
                  <Plus className="mr-2 size-4" />
                  Add row
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  {canDelete ? (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => toggleAll(checked === true)}
                        aria-label="Select all rows"
                      />
                    </TableHead>
                  ) : null}
                  {displayColumns.map((column) => (
                    <TableHead key={column.columnName}>
                      {toDatatableDisplayLabel(column.columnName)}
                    </TableHead>
                  ))}
                  {showActionsColumn ? (
                    <TableHead className="w-[1%] text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectableRows.map(({ row, rowId }) => {
                  const selected = selectedRowIds.includes(rowId);
                  return (
                    <TableRow key={rowId} data-state={selected ? 'selected' : undefined}>
                      {canDelete ? (
                        <TableCell>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(checked) => toggleRow(rowId, checked === true)}
                            aria-label={`Select row ${rowId}`}
                          />
                        </TableCell>
                      ) : null}
                      {displayColumns.map((column) => {
                        const controlName = getDatatableControlName(column);
                        const raw = row[column.columnName] ?? row[controlName];
                        return (
                          <TableCell key={column.columnName}>
                            {formatDatatableCellValueForColumn(column, raw)}
                          </TableCell>
                        );
                      })}
                      {showActionsColumn ? (
                        <TableCell className="text-right">
                          {canCreate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditSheet(row, rowId)}
                              disabled={pending}
                              aria-label="Edit row"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
                {displayOnlyRows.map((row, index) => (
                  <TableRow key={`row-${index}`}>
                    {canDelete ? <TableCell /> : null}
                    {displayColumns.map((column) => {
                      const controlName = getDatatableControlName(column);
                      const raw = row[column.columnName] ?? row[controlName];
                      return (
                        <TableCell key={column.columnName}>
                          {formatDatatableCellValueForColumn(column, raw)}
                        </TableCell>
                      );
                    })}
                    {showActionsColumn ? <TableCell /> : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DetailSection>

      <ClientDatatableFormSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={sheetTitle}
        columns={columns}
        values={sheetValues}
        onSave={handleSave}
        submitLabel={sheetMode?.kind === 'edit' ? 'Save changes' : 'Add row'}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected rows?</DialogTitle>
            <DialogDescription>
              This removes {selectedRowIds.length} row(s) from {title}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteSelected} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

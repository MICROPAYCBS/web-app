'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState
} from '@tanstack/react-table';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { SystemDatatableColumnSheet } from '@/components/system/system-datatable-column-sheet';
import {
  filterEditableColumnDrafts,
  type SystemDatatableColumnDraft
} from '@/lib/fineract/system-datatable-form';
import { isSystemColumn } from '@/lib/fineract/datatables';

function BoolCell({ value }: { value?: boolean }) {
  if (value) {
    return <Check className="size-4 text-primary" aria-label="Yes" />;
  }
  return <X className="size-4 text-muted-foreground" aria-label="No" />;
}

export function SystemDatatableColumnsEditor({
  columns,
  onChange,
  codeOptions
}: {
  columns: SystemDatatableColumnDraft[];
  onChange: (columns: SystemDatatableColumnDraft[]) => void;
  codeOptions: { value: string; label: string }[];
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [activeColumn, setActiveColumn] = useState<SystemDatatableColumnDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemDatatableColumnDraft | null>(null);

  const visibleColumns = useMemo(() => filterEditableColumnDrafts(columns), [columns]);

  const tableColumns = useMemo<ColumnDef<SystemDatatableColumnDraft>[]>(
    () => [
      {
        accessorKey: 'columnName',
        header: 'Name',
        cell: ({ row }) => row.original.columnName
      },
      {
        accessorKey: 'columnDisplayType',
        header: 'Type'
      },
      {
        id: 'length',
        header: 'Length',
        cell: ({ row }) => row.original.columnLength ?? '—'
      },
      {
        id: 'code',
        header: 'Code',
        cell: ({ row }) => row.original.columnCode?.trim() || '—'
      },
      {
        id: 'mandatory',
        header: 'Mandatory',
        cell: ({ row }) => <BoolCell value={row.original.isColumnNullable === false} />
      },
      {
        id: 'unique',
        header: 'Unique',
        cell: ({ row }) => <BoolCell value={row.original.isColumnUnique} />
      },
      {
        id: 'indexed',
        header: 'Indexed',
        cell: ({ row }) => <BoolCell value={row.original.isColumnIndexed} />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Edit ${row.original.columnName}`}
              onClick={() => {
                setDialogMode('edit');
                setActiveColumn(row.original);
                setDialogOpen(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Delete ${row.original.columnName}`}
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: visibleColumns,
    columns: tableColumns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  function handleSaveColumn(nextColumn: SystemDatatableColumnDraft) {
    if (isSystemColumn(nextColumn.columnName)) {
      return;
    }

    if (dialogMode === 'add') {
      const duplicate = visibleColumns.some(
        (column) => column.columnName.toLowerCase() === nextColumn.columnName.toLowerCase()
      );
      if (duplicate) {
        return;
      }
      onChange(filterEditableColumnDrafts([...columns, nextColumn]));
      return;
    }

    onChange(
      filterEditableColumnDrafts(
        columns.map((column) => {
          if (column === activeColumn) {
            return nextColumn;
          }
          if (
            activeColumn &&
            column.columnName === activeColumn.columnName &&
            column.kind === activeColumn.kind
          ) {
            return nextColumn;
          }
          return column;
        })
      )
    );
  }

  function confirmDelete() {
    if (!deleteTarget || isSystemColumn(deleteTarget.columnName)) {
      return;
    }
    onChange(filterEditableColumnDrafts(columns.filter((column) => column !== deleteTarget)));
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-medium">Columns</h2>
          <p className="text-sm text-muted-foreground">Add custom fields for this data table.</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setDialogMode('add');
            setActiveColumn(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Add column
        </Button>
      </div>

      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No columns yet"
        emptyDescription="Add at least one column before submitting."
      />
      <DataTablePagination table={table} totalRecords={visibleColumns.length} />

      <SystemDatatableColumnSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        column={activeColumn}
        codeOptions={codeOptions}
        onSave={handleSaveColumn}
      />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete column</DialogTitle>
            <DialogDescription>
              Remove column &ldquo;{deleteTarget?.columnName}&rdquo;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

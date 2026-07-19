'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDatatableTemplate } from '@mifos/api-client';
import { Pencil, Plus, Table2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ClientDatatableFormSheet } from '@/components/clients/shared/client-datatable-form-sheet';
import { EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import { formatDatatableCellValueForColumn, formatDatatableTableTitle, manyToOneDisplayColumns } from '@/lib/fineract/client-datatable-utils';
import { getDatatableCellRawValue, toDatatableDisplayLabel } from '@/lib/fineract/datatables';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { validateDatatableStep, type StepErrors } from '../validation';

type SheetMode = { kind: 'add' } | { kind: 'edit'; index: number; values: Record<string, unknown> };

type DatatableSaveResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function MultiRowDatatableStep({
  datatable,
  rows,
  errors,
  required = false,
  onChange
}: {
  datatable: FineractClientDatatableTemplate;
  rows: Record<string, unknown>[];
  errors: StepErrors;
  required?: boolean;
  onChange: (rows: Record<string, unknown>[]) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null);

  const title = formatDatatableTableTitle(datatable.registeredTableName);
  const columns = datatable.columnHeaderData ?? [];
  const displayColumns = useMemo(() => manyToOneDisplayColumns(columns), [columns]);
  const formError = errors._form;

  function openAdd() {
    setSheetMode({ kind: 'add' });
    setSheetOpen(true);
  }

  function openEdit(index: number) {
    setSheetMode({ kind: 'edit', index, values: rows[index] ?? {} });
    setSheetOpen(true);
  }

  function remove(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  async function handleSave(values: Record<string, unknown>): Promise<DatatableSaveResult> {
    if (!sheetMode) {
      return { ok: false, message: 'No row selected.' };
    }

    const fieldErrors = validateDatatableStep(datatable, values);
    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        message: 'Please fix the highlighted fields.',
        fieldErrors
      };
    }

    if (sheetMode.kind === 'add') {
      onChange([...rows, values]);
    } else {
      onChange(rows.map((row, index) => (index === sheetMode.index ? values : row)));
    }

    return { ok: true };
  }

  const sheetTitle = sheetMode?.kind === 'edit' ? `Edit ${title} row` : `Add ${title} row`;
  const sheetValues = sheetMode?.kind === 'edit' ? sheetMode.values : {};
  const sheetKey =
    sheetMode?.kind === 'edit' ? `${datatable.registeredTableName}-${sheetMode.index}` : 'new';

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add one or more rows for <strong>{title}</strong>.
        {required
          ? ' At least one row is required for the customer status you selected.'
          : ' This step is optional unless required fields are filled in.'}
      </p>

      {formError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="button" variant="outline" size="sm" onClick={openAdd}>
        <Plus className="mr-2 size-4" />
        Add row
      </Button>

      {rows.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="No rows added yet"
          description="Multi-row tables can hold multiple records for this customer."
          action={
            <Button type="button" variant="outline" size="sm" onClick={openAdd}>
              <Plus className="mr-2 size-4" />
              Add row
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                {displayColumns.map((column) => (
                  <TableHead key={column.columnName}>
                    {toDatatableDisplayLabel(column.columnName)}
                  </TableHead>
                ))}
                <TableHead className="w-[1%] text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {displayColumns.map((column) => {
                    const raw = getDatatableCellRawValue(column, row);
                    return (
                      <TableCell key={column.columnName}>
                        {formatDatatableCellValueForColumn(column, raw)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(index)}
                        aria-label="Edit row"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                        aria-label="Remove row"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
    </div>
  );
}

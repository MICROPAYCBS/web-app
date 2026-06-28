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
import { useState, useTransition } from 'react';
import {
  deleteClientDatatableAction,
  saveClientDatatableAction
} from '@/actions/client-datatable';
import { ClientDatatableFormSheet } from '@/components/clients/shared/client-datatable-form-sheet';
import { DatatableRowKindBadge, DetailField, DetailFieldGrid, DetailSection, EmptyState } from '@/components/composites';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { formatDatatableCellValueForColumn, formatDatatableTableTitle } from '@/lib/fineract/client-datatable-utils';
import {
  filterSystemColumns,
  getDatatableCellRawValue,
  getDatatableControlName,
  toDatatableDisplayLabel
} from '@/lib/fineract/datatables';

type DatatableSaveResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function ClientDatatableView({
  clientId,
  registeredTableName,
  columns,
  row,
  values,
  hasEntry,
  canCreate,
  canDelete
}: {
  clientId: string;
  registeredTableName: string;
  columns: FineractDatatableColumnHeader[];
  row: Record<string, unknown> | null;
  values: Record<string, unknown>;
  hasEntry: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const title = formatDatatableTableTitle(registeredTableName);
  const displayColumns = filterSystemColumns(columns);

  function refresh() {
    router.refresh();
  }

  async function handleSave(formValues: Record<string, unknown>): Promise<DatatableSaveResult> {
    const result = await saveClientDatatableAction(clientId, registeredTableName, formValues);
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

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteClientDatatableAction(clientId, registeredTableName);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      refresh();
    });
  }

  const canEdit = hasEntry ? canCreate : canCreate;

  return (
    <>
      <DetailSection
        title={title}
        titleAccessory={<DatatableRowKindBadge multiRow={false} />}
        description="One record per customer for this table."
        actions={
          canEdit ? (
            <div className="flex flex-wrap gap-2">
              {!hasEntry ? (
                <Button type="button" size="sm" onClick={() => setSheetOpen(true)} disabled={pending}>
                  <Plus className="mr-2 size-4" />
                  Add
                </Button>
              ) : (
                <>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSheetOpen(true)} disabled={pending}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  {canDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteOpen(true)}
                      disabled={pending}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          ) : null
        }
      >
        {actionError ? (
          <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}

        {!hasEntry ? (
          <EmptyState
            icon={Table2}
            title="No data yet"
            description={`Add a ${title.toLowerCase()} record for this customer.`}
            action={
              canCreate ? (
                <Button type="button" size="sm" onClick={() => setSheetOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Add
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DetailFieldGrid>
            {displayColumns.map((column) => {
              const raw = row ? getDatatableCellRawValue(column, row) : values[getDatatableControlName(column)];

              return (
                <DetailField key={column.columnName} label={toDatatableDisplayLabel(column.columnName)}>
                  {formatDatatableCellValueForColumn(column, raw)}
                </DetailField>
              );
            })}
          </DetailFieldGrid>
        )}
      </DetailSection>

      <ClientDatatableFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={hasEntry ? `Edit ${title}` : `Add ${title}`}
        columns={columns}
        values={values}
        onSave={handleSave}
        submitLabel={hasEntry ? 'Save changes' : 'Add'}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {title}?</DialogTitle>
            <DialogDescription>
              This removes all custom field values for this table on the customer. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

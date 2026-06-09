'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableDefinition } from '@mifos/api-client';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { deleteSystemDatatableAction } from '@/actions/system-datatable';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage,
  DetailSection
} from '@/components/composites';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { SystemDataTableColumnsTable } from '@/components/system/system-data-table-columns-table';
import {
  formatApplicationTableLabel,
  formatEntitySubType
} from '@/lib/fineract/system-datatables-display';
import {
  datatableRowKindLabel,
  isManyToOneDatatableColumns
} from '@/lib/fineract/client-datatable-utils';
import { cn } from '@/lib/utils';
import { filterUserDatatableColumns } from '@/lib/fineract/system-datatable-form';

export function SystemDataTableDetailView({
  definition,
  canEdit,
  canDelete
}: {
  definition: FineractDatatableDefinition;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const registeredTableName = definition.registeredTableName ?? '';
  const columnHeaders = definition.columnHeaderData ?? [];
  const userColumnCount = useMemo(
    () => filterUserDatatableColumns(columnHeaders).length,
    [columnHeaders]
  );
  const multiRow = isManyToOneDatatableColumns(columnHeaders);

  function handleDelete() {
    setActionError(null);
    startTransition(async () => {
      const result = await deleteSystemDatatableAction(registeredTableName);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteOpen(false);
      router.push('/system/data-tables');
      router.refresh();
    });
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={<DetailBackLink href="/system/data-tables" label="Back to data tables" />}
            title={registeredTableName}
            status={{ label: datatableRowKindLabel(multiRow), variant: 'outline' }}
            actions={
              canEdit || canDelete ? (
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={`/system/data-tables/${encodeURIComponent(registeredTableName)}/edit`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </Link>
                  ) : null}
                  {canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                      disabled={pending}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              ) : null
            }
          />
        }
        summary={
          <DetailFieldGrid columns={3}>
            <DetailField label="Associated with">
              {formatApplicationTableLabel(definition.applicationTableName)}
            </DetailField>
            <DetailField label="Sub type">
              {formatEntitySubType(definition.entitySubType)}
            </DetailField>
            <DetailField label="Row type">{datatableRowKindLabel(multiRow)}</DetailField>
            <DetailField label="Columns">{userColumnCount}</DetailField>
          </DetailFieldGrid>
        }
      >
        <DetailSection title="Columns" description="Field definitions for this data table.">
          <SystemDataTableColumnsTable columns={columnHeaders} />
        </DetailSection>
      </DetailPage>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete data table</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{registeredTableName}&rdquo;? This removes the table definition and
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={pending}
            >
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

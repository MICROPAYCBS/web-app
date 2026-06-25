'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ContactType, ContactTypeTemplate } from '@mifos/api-client';

import { formatActionErrorMessage } from '@mifos/validation';

import {

  getCoreRowModel,

  getPaginationRowModel,

  useReactTable,

  type ColumnDef,

  type PaginationState

} from '@tanstack/react-table';

import { Pencil, Trash2 } from 'lucide-react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { useMemo, useState, useTransition } from 'react';

import { deleteContactTypeAction } from '@/actions/contact-type';

import { DataTable } from '@/components/composites/data-table/data-table';

import { DataTablePagination } from '@/components/composites/data-table/data-table-pagination';

import { Button, buttonVariants } from '@/components/ui/button';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle

} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';

import { contactTypeEditPath } from '@/lib/fineract/contact-type-paths';

import { cn } from '@/lib/utils';



export function ContactTypesTable({

  contactTypes,

  canEdit,

  canDelete

}: {

  contactTypes: ContactType[];

  canEdit: boolean;

  canDelete: boolean;

}) {

  const [filter, setFilter] = useState('');

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<ContactType | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();



  const filteredRows = useMemo(() => {

    const q = filter.trim().toLowerCase();

    if (!q) {

      return contactTypes;

    }

    return contactTypes.filter((row) =>

      [

        row.typeCode,

        row.typeName,

        row.example,

        row.mandatory ? 'mandatory' : '',

        row.status

      ]

        .filter(Boolean)

        .join(' ')

        .toLowerCase()

        .includes(q)

    );

  }, [contactTypes, filter]);



  const columns = useMemo<ColumnDef<ContactType>[]>(

    () => [

      {

        accessorKey: 'typeCode',

        header: 'Code',

        cell: ({ row }) => <span className="font-mono text-sm">{row.original.typeCode}</span>

      },

      {

        accessorKey: 'typeName',

        header: 'Name'

      },

      {

        accessorKey: 'example',

        header: 'Example',

        cell: ({ row }) => row.original.example ?? '—'

      },

      {

        id: 'mandatory',

        header: 'Mandatory',

        cell: ({ row }) => (row.original.mandatory ? 'Yes' : 'No')

      },

      {

        accessorKey: 'displayOrder',

        header: 'Order',

        cell: ({ row }) => row.original.displayOrder ?? '—'

      },

      {

        accessorKey: 'status',

        header: 'Status'

      },

      {

        id: 'actions',

        header: '',

        cell: ({ row }) => (

          <div className="flex justify-end gap-2">

            {canEdit ? (

              <Link

                href={contactTypeEditPath(row.original.id)}

                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}

                aria-label={`Edit ${row.original.typeName}`}

              >

                <Pencil className="size-4" />

              </Link>

            ) : null}

            {canDelete ? (

              <Button

                type="button"

                variant="ghost"

                size="icon"

                aria-label={`Delete ${row.original.typeName}`}

                onClick={() => {

                  setActionError(null);

                  setDeleteTarget(row.original);

                }}

              >

                <Trash2 className="size-4" />

              </Button>

            ) : null}

          </div>

        )

      }

    ],

    [canDelete, canEdit]

  );



  const table = useReactTable({

    data: filteredRows,

    columns,

    state: { pagination },

    onPaginationChange: setPagination,

    getCoreRowModel: getCoreRowModel(),

    getPaginationRowModel: getPaginationRowModel()

  });



  function confirmDelete() {

    if (!deleteTarget) {

      return;

    }

    startTransition(async () => {

      const result = await deleteContactTypeAction(deleteTarget.id);

      if (!result.ok) {

        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));

        return;

      }

      setDeleteTarget(null);

      router.refresh();

    });

  }



  return (

    <>

      <div className="mb-4">

        <Input

          value={filter}

          onChange={(event) => setFilter(event.target.value)}

          placeholder="Filter contact types…"

          className="max-w-sm"

        />

      </div>

      <DataTable table={table} />

      <DataTablePagination table={table} totalRecords={filteredRows.length} />

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Delete contact type</DialogTitle>

            <DialogDescription>

              Delete &ldquo;{deleteTarget?.typeName}&rdquo;? Customers using this contact type may be

              affected.

            </DialogDescription>

          </DialogHeader>

          {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

          <DialogFooter>

            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>

              Cancel

            </Button>

            <Button type="button" variant="destructive" disabled={pending} onClick={confirmDelete}>

              Delete

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </>

  );

}



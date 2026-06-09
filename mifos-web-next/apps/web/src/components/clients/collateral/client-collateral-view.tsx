'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type { ClientCollateralListItem } from '@mifos/api-client';

import { Can } from '@mifos/auth';

import { formatActionErrorMessage } from '@mifos/validation';

import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

import { Landmark, Plus, Trash2 } from 'lucide-react';

import Link from 'next/link';

import { useMemo, useState, useTransition } from 'react';

import { toast } from 'sonner';

import { deleteClientCollateralAction } from '@/actions/client-collateral';

import { ClientDetailResourceView } from '@/components/clients/detail/client-detail-resource-view';

import { MoneyValue } from '@/components/composites/detail/money-value';

import { DataTable } from '@/components/composites/data-table/data-table';

import { Button, buttonVariants } from '@/components/ui/button';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle

} from '@/components/ui/dialog';

import { clientCollateralCreatePath } from '@/lib/fineract/client-secondary-list-paths';

import { collateralProductCurrencyCode } from '@/lib/fineract/collateral-product-display';

import {

  clientCollateralTotalCollateralValue,

  clientCollateralTotalValue

} from '@/lib/fineract/client-collateral-display';

import { cn } from '@/lib/utils';



export function ClientCollateralView({

  clientId,

  items,

  setItems

}: {

  clientId: string;

  items: ClientCollateralListItem[];

  setItems: React.Dispatch<React.SetStateAction<ClientCollateralListItem[]>>;

}) {

  const [error, setError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<ClientCollateralListItem | null>(null);



  const createHref = clientCollateralCreatePath(clientId);

  const createButton = (

    <Can permission="CREATE_CLIENT_COLLATERAL_PRODUCT">

      <Link href={createHref} className={cn(buttonVariants({ size: 'sm' }))}>

        <Plus className="mr-2 size-4" />

        Add collateral

      </Link>

    </Can>

  );



  const columns = useMemo<ColumnDef<ClientCollateralListItem>[]>(

    () => [

      {

        id: 'id',

        header: 'ID',

        cell: ({ row }) => row.original.collateralId ?? row.original.id ?? '—'

      },

      {

        id: 'name',

        header: 'Name',

        cell: ({ row }) => row.original.name ?? '—'

      },

      {

        id: 'quantity',

        header: () => <span className="block w-full text-right">Quantity</span>,

        cell: ({ row }) => (

          <span className="block w-full text-right tabular-nums">

            {row.original.quantity ?? '—'}

          </span>

        )

      },

      {

        id: 'totalValue',

        header: () => <span className="block w-full text-right">Total value</span>,

        cell: ({ row }) => (

          <span className="block w-full text-right">

            <MoneyValue

              amount={clientCollateralTotalValue(row.original)}

              currencyCode={collateralProductCurrencyCode(row.original.currency) ?? 'USD'}

            />

          </span>

        )

      },

      {

        id: 'totalCollateral',

        header: () => (

          <span className="block w-full text-right">Total collateral value</span>

        ),

        cell: ({ row }) => (

          <span className="block w-full text-right">

            <MoneyValue

              amount={clientCollateralTotalCollateralValue(row.original)}

              currencyCode={collateralProductCurrencyCode(row.original.currency) ?? 'USD'}

            />

          </span>

        )

      },

      {

        id: 'actions',

        header: () => <span className="sr-only">Actions</span>,

        cell: ({ row }) => {

          const rowId = row.original.id ?? row.original.collateralId;

          return (

            <Can permission="DELETE_CLIENT_COLLATERAL_PRODUCT">

              <Button

                type="button"

                variant="ghost"

                size="icon"

                title="Delete"

                disabled={pending}

                onClick={() => setDeleteTarget({ ...row.original, id: rowId })}

              >

                <Trash2 className="size-4 text-destructive" />

                <span className="sr-only">Delete</span>

              </Button>

            </Can>

          );

        }

      }

    ],

    [pending]

  );



  const table = useReactTable({

    data: items,

    columns,

    getCoreRowModel: getCoreRowModel()

  });



  function confirmDelete() {

    if (!deleteTarget) {

      return;

    }

    const targetId = deleteTarget.id ?? deleteTarget.collateralId;

    if (targetId === undefined) {

      return;

    }

    startTransition(async () => {

      const result = await deleteClientCollateralAction(clientId, targetId);

      if (!result.ok) {

        setError(formatActionErrorMessage(result.message, result.fieldErrors));

        return;

      }

      setDeleteTarget(null);

      setItems((prev) =>

        prev.filter((item) => (item.id ?? item.collateralId) !== targetId)

      );

      toast.success('Collateral removed.');

    });

  }



  return (

    <>

      <ClientDetailResourceView

        description="Collateral registered against this client."

        toolbar={createButton}

        error={error}

        isEmpty={items.length === 0}

        emptyIcon={Landmark}

        emptyTitle="No collateral on file"

        emptyDescription="Add collateral products linked to this client."

        emptyAction={createButton}

      >

        <DataTable table={table} isLoading={pending} stickyHeader={false} />

      </ClientDetailResourceView>



      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Remove collateral?</DialogTitle>

            <DialogDescription>

              This removes {deleteTarget?.name ?? 'this collateral item'} from the client. This

              cannot be undone.

            </DialogDescription>

          </DialogHeader>

          <DialogFooter>

            <Button

              type="button"

              variant="outline"

              disabled={pending}

              onClick={() => setDeleteTarget(null)}

            >

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


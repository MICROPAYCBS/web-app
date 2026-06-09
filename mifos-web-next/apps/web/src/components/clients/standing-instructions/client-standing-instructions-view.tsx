'use client';



/**

 * Copyright since 2026 Mifos Initiative

 *

 * This Source Code Form is subject to the terms of the Mozilla Public

 * License, v. 2.0. If a copy of the MPL was not distributed with this

 * file, You can obtain one at http://mozilla.org/MPL/2.0/.

 */



import type {

  FineractEnumOption,

  StandingInstructionListItem

} from '@mifos/api-client';

import { Can } from '@mifos/auth';

import { formatActionErrorMessage } from '@mifos/validation';

import {

  getCoreRowModel,

  useReactTable,

  type ColumnDef

} from '@tanstack/react-table';

import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react';

import Link from 'next/link';

import { useMemo, useState, useTransition } from 'react';

import { toast } from 'sonner';

import {

  deleteClientStandingInstructionAction,

  fetchClientStandingInstructionsAction

} from '@/actions/client-standing-instruction';

import { ClientDetailResourceView } from '@/components/clients/detail/client-detail-resource-view';

import { EmptyState } from '@/components/composites';

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

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { sanitizeNumericInput } from '@/components/composites/numeric-field';

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue

} from '@/components/ui/select';

import { clientStandingInstructionsCreatePath } from '@/lib/fineract/client-secondary-list-paths';

import {

  standingInstructionEnumLabel,

  standingInstructionValidityLabel

} from '@/lib/fineract/standing-instruction-display';

import { cn } from '@/lib/utils';



function enumSelectOptions(options: FineractEnumOption[] | undefined) {

  return (options ?? []).map((opt) => ({

    value: String(opt.id),

    label: standingInstructionEnumLabel(opt)

  }));

}



export function ClientStandingInstructionsView({

  clientId,

  clientName,

  officeId,

  fromAccountType,

  initialItems,

  transferTypeOptions,

  showCreate

}: {

  clientId: string;

  clientName: string;

  officeId?: number;

  fromAccountType: string;

  initialItems: StandingInstructionListItem[];

  transferTypeOptions: FineractEnumOption[];

  showCreate: boolean;

}) {

  const [items, setItems] = useState(initialItems);

  const [transferType, setTransferType] = useState<string>('');

  const [fromAccountId, setFromAccountId] = useState('');

  const [error, setError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<StandingInstructionListItem | null>(null);



  const transferOptions = enumSelectOptions(transferTypeOptions);

  const hasFilter = Boolean(transferType || fromAccountId.trim());



  const createButton = showCreate ? (

    <Can permission="CREATE_STANDINGINSTRUCTION">

      <Link

        href={clientStandingInstructionsCreatePath(clientId, officeId)}

        className={cn(buttonVariants({ size: 'sm' }))}

      >

        <Plus className="mr-2 size-4" />

        New standing instruction

      </Link>

    </Can>

  ) : null;



  function applyFilter() {

    setError(null);

    startTransition(async () => {

      const result = await fetchClientStandingInstructionsAction({

        clientId,

        clientName,

        fromAccountType,

        fromTransferType: transferType || undefined,

        fromAccountId: fromAccountId || undefined

      });

      if (!('pageItems' in result)) {

        setError('message' in result ? result.message : 'Could not load standing instructions.');

        return;

      }

      setItems(result.pageItems);

    });

  }



  function confirmDelete() {

    if (!deleteTarget) {

      return;

    }

    startTransition(async () => {

      const result = await deleteClientStandingInstructionAction(clientId, deleteTarget.id);

      if (!result.ok) {

        setError(formatActionErrorMessage(result.message, result.fieldErrors));

        return;

      }

      setDeleteTarget(null);

      toast.success('Standing instruction deleted.');

      applyFilter();

    });

  }



  const columns = useMemo<ColumnDef<StandingInstructionListItem>[]>(

    () => [

      {

        id: 'client',

        header: 'Client',

        cell: ({ row }) => {

          const from = row.original.fromClient;

          return from ? `${from.displayName ?? '—'} (${from.id})` : '—';

        }

      },

      {

        id: 'fromAccount',

        header: 'From account',

        cell: ({ row }) => {

          const account = row.original.fromAccount;

          const type = row.original.fromAccountType;

          if (!account) {

            return '—';

          }

          const typeLabel = type ? standingInstructionEnumLabel(type) : '';

          return `${account.accountNo ?? account.id}${typeLabel ? ` (${typeLabel})` : ''}`;

        }

      },

      {

        id: 'beneficiary',

        header: 'Beneficiary',

        cell: ({ row }) => row.original.toClient?.displayName ?? '—'

      },

      {

        id: 'toAccount',

        header: 'To account',

        cell: ({ row }) => {

          const account = row.original.toAccount;

          const type = row.original.toAccountType;

          if (!account) {

            return '—';

          }

          const typeLabel = type ? standingInstructionEnumLabel(type) : '';

          return `${account.accountNo ?? account.id}${typeLabel ? ` (${typeLabel})` : ''}`;

        }

      },

      {

        id: 'amount',

        header: 'Amount',

        cell: ({ row }) => {

          const type = row.original.instructionType;

          const amount = row.original.amount;

          if (type && amount !== undefined) {

            return `${standingInstructionEnumLabel(type)}/${amount}`;

          }

          return '—';

        }

      },

      {

        id: 'validity',

        header: 'Validity',

        cell: ({ row }) =>

          standingInstructionValidityLabel(row.original.validFrom, row.original.validTill)

      },

      {

        id: 'actions',

        header: () => <span className="sr-only">Actions</span>,

        cell: ({ row }) => {

          if (row.original.status?.value === 'Deleted') {

            return null;

          }

          return (

            <Can permission="DELETE_STANDINGINSTRUCTION">

              <Button

                type="button"

                variant="ghost"

                size="icon"

                title="Delete"

                disabled={pending}

                onClick={() => setDeleteTarget(row.original)}

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



  const filterPanel = (

    <div className="space-y-4">

      <div className="rounded-lg border border-border bg-card p-4">

        <p className="mb-3 text-sm text-muted-foreground">

          Client: <span className="text-foreground">{clientName}</span>

        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="space-y-2">

            <Label htmlFor="si-transfer-type">Transfer type</Label>

            <Select

              value={transferType || '__all__'}

              onValueChange={(v) => setTransferType(v === '__all__' || !v ? '' : v)}

            >

              <SelectTrigger id="si-transfer-type" className="w-full">

                <SelectValue placeholder="All types" />

              </SelectTrigger>

              <SelectContent>

                <SelectItem value="__all__">All types</SelectItem>

                {transferOptions.map((opt) => (

                  <SelectItem key={opt.value} value={opt.value}>

                    {opt.label}

                  </SelectItem>

                ))}

              </SelectContent>

            </Select>

          </div>

          <div className="space-y-2">

            <Label htmlFor="si-from-account">From account ID</Label>

            <Input

              id="si-from-account"

              inputMode="numeric"

              value={fromAccountId}

              onChange={(e) =>

                setFromAccountId(sanitizeNumericInput(e.target.value, { integer: true }))

              }

              placeholder="Optional"

            />

          </div>

        </div>

        <div className="mt-4 flex justify-end">

          <Button type="button" disabled={pending} onClick={applyFilter}>

            {pending ? 'Loading…' : 'Apply filter'}

          </Button>

        </div>

      </div>



      {items.length === 0 ? (

        <EmptyState

          icon={ArrowLeftRight}

          title={

            hasFilter

              ? 'No standing instructions match your filter'

              : 'No standing instructions on file'

          }

          description={

            hasFilter

              ? 'Try different filter criteria or clear the filter and apply again.'

              : "Create one to schedule transfers from this client's accounts."

          }

          action={!hasFilter ? createButton : undefined}

        />

      ) : (

        <DataTable table={table} isLoading={pending} stickyHeader={false} />

      )}

    </div>

  );



  return (

    <>

      <ClientDetailResourceView

        description="Automated transfers configured for this client."

        toolbar={createButton}

        error={error}

        isEmpty={initialItems.length === 0 && !hasFilter && items.length === 0}

        emptyIcon={ArrowLeftRight}

        emptyTitle="No standing instructions on file"

        emptyDescription="Create one to schedule transfers from this client's accounts."

        emptyAction={createButton}

      >

        {filterPanel}

      </ClientDetailResourceView>



      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Delete standing instruction?</DialogTitle>

            <DialogDescription>

              This removes standing instruction {deleteTarget?.id}. This cannot be undone.

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

            <Button

              type="button"

              variant="destructive"

              disabled={pending}

              onClick={confirmDelete}

            >

              Delete

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </>

  );

}


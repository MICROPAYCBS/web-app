'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption, StandingInstructionListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { formatActionErrorMessage } from '@mifos/validation';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import {
  deleteClientStandingInstructionAction,
  fetchClientStandingInstructionsAction
} from '@/actions/client-standing-instruction';
import { ClientDetailResourceView } from '@/components/clients/detail/client-detail-resource-view';
import { ClientStandingInstructionsFilterSheet } from '@/components/clients/standing-instructions/client-standing-instructions-filter-sheet';
import { EmptyState } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { ListFilterTrigger } from '@/components/composites/list-filter-sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { clientStandingInstructionsCreatePath } from '@/lib/fineract/client-secondary-list-paths';
import {
  standingInstructionEnumLabel,
  standingInstructionValidityLabel
} from '@/lib/fineract/standing-instruction-display';
import {
  countActiveStandingInstructionFilters,
  type StandingInstructionListFilters
} from '@/lib/fineract/standing-instruction-query';
import { cn } from '@/lib/utils';

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
  const [filters, setFilters] = useState<StandingInstructionListFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<StandingInstructionListItem | null>(null);

  const activeFilterCount = countActiveStandingInstructionFilters(filters);
  const hasFilter = activeFilterCount > 0;

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

  const loadItems = useCallback(
    (nextFilters: StandingInstructionListFilters) => {
      setError(null);
      startTransition(async () => {
        const result = await fetchClientStandingInstructionsAction({
          clientId,
          clientName,
          fromAccountType,
          fromTransferType: nextFilters.transferType,
          fromAccountId: nextFilters.fromAccountId
        });
        if (!('pageItems' in result)) {
          setError('message' in result ? result.message : 'Could not load standing instructions.');
          return;
        }
        setItems(result.pageItems);
      });
    },
    [clientId, clientName, fromAccountType]
  );

  function handleApplyFilters(nextFilters: StandingInstructionListFilters) {
    setFilters(nextFilters);
    loadItems(nextFilters);
  }

  function handleClearFilters() {
    setFilters({});
    loadItems({});
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
      toastCommandOutcome(result, {
        completed: 'Standing instruction deleted.',
        pending: 'Standing instruction deletion sent for approval.'
      });
      loadItems(filters);
    });
  }

  const columns = useMemo<ColumnDef<StandingInstructionListItem>[]>(
    () => [
      {
        id: 'client',
        header: 'Customer',
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

  const toolbar = createButton;

  const listToolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ListFilterTrigger
        activeCount={activeFilterCount}
        onClick={() => setFilterOpen(true)}
        disabled={pending}
      />
    </div>
  );

  return (
    <>
      <ClientDetailResourceView
        description="Automated transfers configured for this customer."
        toolbar={toolbar}
        error={error}
        isEmpty={initialItems.length === 0 && !hasFilter && items.length === 0}
        emptyIcon={ArrowLeftRight}
        emptyTitle="No standing instructions on file"
        emptyDescription="Create one to schedule transfers from this customer's accounts."
        emptyAction={createButton}
      >
        <div className="space-y-4">
          {listToolbar}
          {items.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title={
                hasFilter
                  ? 'No standing instructions match your filters'
                  : 'No standing instructions on file'
              }
              description={
                hasFilter
                  ? 'Try different filter criteria or clear filters and apply again.'
                  : "Create one to schedule transfers from this customer's accounts."
              }
              action={!hasFilter ? createButton : undefined}
            />
          ) : (
            <DataTable table={table} isLoading={pending} stickyHeader={false} />
          )}
        </div>
      </ClientDetailResourceView>

      <ClientStandingInstructionsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        clientName={clientName}
        transferTypeOptions={transferTypeOptions}
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        pending={pending}
      />

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
            <Button type="button" variant="destructive" disabled={pending} onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

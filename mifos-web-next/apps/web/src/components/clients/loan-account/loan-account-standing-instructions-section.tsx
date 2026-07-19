'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionListItem, StandingInstructionTemplate } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { formatActionErrorMessage } from '@mifos/validation';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';
import { ArrowLeftRight, Eye, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { deleteClientStandingInstructionAction } from '@/actions/client-standing-instruction';
import {
  CreateStandingInstructionSheet,
  type CreateStandingInstructionFormDefaults
} from '@/components/clients/standing-instructions/create-standing-instruction-sheet';
import { ViewStandingInstructionSheet } from '@/components/clients/standing-instructions/view-standing-instruction-sheet';
import { DetailSection, EmptyState } from '@/components/composites';
import { DataTable } from '@/components/composites/data-table/data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  loanAccountHasActiveStandingInstruction,
  loanAccountStandingInstructionCreateDefaults,
  loanAccountStandingInstructionGeneralPath
} from '@/lib/fineract/loan-account-standing-instructions';
import {
  standingInstructionEnumLabel,
  standingInstructionValidityLabel
} from '@/lib/fineract/standing-instruction-display';

export type LoanAccountStandingInstructionPermissions = {
  read: boolean;
  create: boolean;
  delete: boolean;
};

function beneficiaryLabel(item: StandingInstructionListItem): string {
  if (
    item.fromClient?.id != null &&
    item.toClient?.id != null &&
    item.fromClient.id === item.toClient.id
  ) {
    return 'Own account';
  }
  return item.toClient?.displayName ?? '—';
}

export function LoanAccountStandingInstructionsSection({
  account,
  clientId,
  clientName,
  fromOfficeId,
  initialItems,
  createTemplate,
  permissions,
  canCreate,
  createFormDefaults
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  clientName: string;
  fromOfficeId: number;
  initialItems: StandingInstructionListItem[];
  createTemplate: StandingInstructionTemplate | null;
  permissions: LoanAccountStandingInstructionPermissions;
  canCreate: boolean;
  createFormDefaults: CreateStandingInstructionFormDefaults | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StandingInstructionListItem | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const revalidatePath = loanAccountStandingInstructionGeneralPath(clientId, account.id);
  const showCreateButton =
    canCreate &&
    permissions.create &&
    createTemplate != null &&
    createFormDefaults != null &&
    !loanAccountHasActiveStandingInstruction(items, account.id);

  const createButton = showCreateButton ? (
    <Can permission="CREATE_STANDINGINSTRUCTION">
      <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
        <Plus className="mr-2 size-4" />
        New standing instruction
      </Button>
    </Can>
  ) : null;

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    startTransition(async () => {
      const result = await deleteClientStandingInstructionAction(clientId, deleteTarget.id, {
        revalidatePaths: [revalidatePath]
      });
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      toastCommandOutcome(result, {
        completed: 'Standing instruction deleted.',
        pending: 'Standing instruction deletion sent for approval.'
      });
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
    });
  }

  const columns = useMemo<ColumnDef<StandingInstructionListItem>[]>(
    () => [
      {
        id: 'fromAccount',
        header: 'From account',
        cell: ({ row }) => {
          const accountRef = row.original.fromAccount;
          const type = row.original.fromAccountType;
          if (!accountRef) {
            return '—';
          }
          const typeLabel = type ? standingInstructionEnumLabel(type) : '';
          return `${accountRef.accountNo ?? accountRef.id}${typeLabel ? ` (${typeLabel})` : ''}`;
        }
      },
      {
        id: 'beneficiary',
        header: 'Beneficiary',
        cell: ({ row }) => beneficiaryLabel(row.original)
      },
      {
        id: 'toAccount',
        header: 'To account',
        cell: ({ row }) => {
          const accountRef = row.original.toAccount;
          const type = row.original.toAccountType;
          if (!accountRef) {
            return '—';
          }
          const typeLabel = type ? standingInstructionEnumLabel(type) : '';
          return `${accountRef.accountNo ?? accountRef.id}${typeLabel ? ` (${typeLabel})` : ''}`;
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
        id: 'status',
        header: 'Status',
        cell: ({ row }) => standingInstructionEnumLabel(row.original.status)
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          if (row.original.status?.value === 'Deleted') {
            return null;
          }
          return (
            <div className="flex justify-end gap-1">
              {permissions.read ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="View"
                  onClick={() => setViewId(row.original.id)}
                >
                  <Eye className="size-4" />
                  <span className="sr-only">View</span>
                </Button>
              ) : null}
              {permissions.delete ? (
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
              ) : null}
            </div>
          );
        }
      }
    ],
    [pending, permissions.delete, permissions.read]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  if (!permissions.read) {
    return null;
  }

  return (
    <>
      <DetailSection
        title="Standing instructions"
        actions={createButton}
      >
        {error ? (
          <p
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No standing instructions"
            description={
              canCreate && !createFormDefaults
                ? 'Link a savings account on this loan before setting up automated repayments.'
                : 'Create a standing instruction to schedule repayments from the linked savings account.'
            }
            action={createButton}
          />
        ) : (
          <DataTable table={table} stickyHeader={false} isLoading={pending} />
        )}
      </DetailSection>

      {createTemplate && createFormDefaults ? (
        <CreateStandingInstructionSheet
          clientId={clientId}
          fromOfficeId={fromOfficeId}
          fromAccountType="2"
          initialTemplate={createTemplate}
          initialFormDefaults={createFormDefaults}
          revalidatePaths={[revalidatePath]}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      ) : null}

      <ViewStandingInstructionSheet
        instructionId={viewId}
        open={viewId != null}
        onOpenChange={(open) => {
          if (!open) {
            setViewId(null);
          }
        }}
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

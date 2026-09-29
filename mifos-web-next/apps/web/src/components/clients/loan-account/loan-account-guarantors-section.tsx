'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage, GUARANTOR_TYPE_EXTERNAL } from '@mifos/validation';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  deleteLoanGuarantorAction,
  recoverLoanGuaranteesAction
} from '@/actions/loan-guarantor';
import { LoanAccountGuarantorSheet } from '@/components/clients/loan-account/loan-account-guarantor-sheet';
import type { LoanAccountGuarantorsContext } from '@/components/clients/loan-account/loan-account-related-context';
import { DetailSection } from '@/components/composites';
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
import { formatAccountMoney } from '@/lib/fineract/format-account-money';
import {
  loanGuaranteeShortfall,
  loanGuarantorCanRemovePerson,
  loanGuarantorDisplayName,
  loanGuarantorFundingCanRemove,
  loanGuarantorFundingStatusLabel
} from '@/lib/fineract/loan-guarantor-display';
import type { FineractLoanAccountDetail, LoanGuarantorRecord } from '@/lib/fineract/loan-account-types';

const DELETE_TOAST = {
  completed: 'Guarantor removed.',
  pending: 'Guarantor removal submitted for approval.'
};

const RECOVER_TOAST = {
  completed: 'Pledged savings recovered onto the loan.',
  pending: 'Guarantee recovery submitted for approval.'
};

type DeleteTarget =
  | { kind: 'person'; guarantor: LoanGuarantorRecord }
  | { kind: 'funding'; guarantor: LoanGuarantorRecord; fundingId: number; label: string };

export function LoanAccountGuarantorsSection({
  account,
  clientId,
  context,
  addOpen,
  onAddOpenChange
}: {
  account: FineractLoanAccountDetail;
  clientId: string;
  context: LoanAccountGuarantorsContext;
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  const [editing, setEditing] = useState<LoanGuarantorRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const currencyCode = account.currency.code;
  const principal = account.principal ?? account.approvedPrincipal ?? account.proposedPrincipal;
  const open = editing != null || (addOpen ?? internalOpen);
  const setOpen = (next: boolean) => {
    if (!next) {
      setEditing(null);
      onAddOpenChange?.(false);
      setInternalOpen(false);
      return;
    }
    if (onAddOpenChange && editing == null) {
      onAddOpenChange(true);
      return;
    }
    setInternalOpen(true);
  };

  const shortfall = loanGuaranteeShortfall({
    principal,
    thresholds: context.guarantee,
    guarantors: context.items,
    borrowerClientId: account.clientId
  });

  const columns = useMemo<ColumnDef<LoanGuarantorRecord>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const record = row.original;
          const externalAddress =
            record.guarantorTypeId === GUARANTOR_TYPE_EXTERNAL
              ? [
                  record.addressLine1,
                  record.addressLine2,
                  record.city,
                  record.state,
                  record.country,
                  record.zip
                ]
                  .filter(Boolean)
                  .join(', ')
              : '';
          return (
            <div className="space-y-1">
              <p>{loanGuarantorDisplayName(record)}</p>
              {record.guarantorTypeId === GUARANTOR_TYPE_EXTERNAL && record.nationalIdNumber ? (
                <p className="text-xs text-muted-foreground">{record.nationalIdNumber}</p>
              ) : null}
              {externalAddress ? (
                <p className="text-xs text-muted-foreground">{externalAddress}</p>
              ) : null}
              {record.officeName ? (
                <p className="text-xs text-muted-foreground">{record.officeName}</p>
              ) : null}
              {record.joinedDate ? (
                <p className="text-xs text-muted-foreground">Joined {record.joinedDate}</p>
              ) : null}
              {record.externalId ? (
                <p className="text-xs text-muted-foreground">{record.externalId}</p>
              ) : null}
              {record.funding.map((line) => (
                <p key={line.id} className="text-xs text-muted-foreground">
                  {loanGuarantorFundingStatusLabel(line.statusId)}
                  {line.savingsAccountNo ? ` · ${line.savingsAccountNo}` : ''}
                  {line.amount != null ? ` · ${formatAccountMoney(line.amount, currencyCode)}` : ''}
                  {line.amountRemaining != null
                    ? ` · ${formatAccountMoney(line.amountRemaining, currencyCode)} remaining`
                    : ''}
                </p>
              ))}
            </div>
          );
        }
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => row.original.guarantorTypeName ?? '—'
      },
      {
        id: 'relationship',
        header: 'Relationship',
        cell: ({ row }) => row.original.clientRelationshipTypeName ?? '—'
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (row.original.active ? 'Active' : 'Removed')
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const record = row.original;
          if (!record.active) {
            return null;
          }
          return (
            <div className="flex flex-wrap gap-2">
              {context.canUpdate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(record);
                    setInternalOpen(true);
                  }}
                >
                  Edit
                </Button>
              ) : null}
              {context.canDelete && loanGuarantorCanRemovePerson(record) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget({ kind: 'person', guarantor: record })}
                >
                  Remove
                </Button>
              ) : null}
              {context.canDelete
                ? record.funding.filter(loanGuarantorFundingCanRemove).map((line) => (
                    <Button
                      key={line.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDeleteTarget({
                          kind: 'funding',
                          guarantor: record,
                          fundingId: line.id,
                          label: line.savingsAccountNo ?? `pledge ${line.id}`
                        })
                      }
                    >
                      Remove pledge
                    </Button>
                  ))
                : null}
            </div>
          );
        }
      }
    ],
    [context.canDelete, context.canUpdate, currencyCode]
  );

  const table = useReactTable({
    data: context.items,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteLoanGuarantorAction(
        clientId,
        account.id,
        target.guarantor.id,
        target.kind === 'funding' ? target.fundingId : undefined
      );
      if (!toastCommandOutcome(result, DELETE_TOAST)) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setDeleteTarget(null);
      router.refresh();
    });
  }

  function handleRecover() {
    setActionError(null);
    startTransition(async () => {
      const result = await recoverLoanGuaranteesAction(clientId, account.id);
      if (!toastCommandOutcome(result, RECOVER_TOAST)) {
        setActionError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setRecoverOpen(false);
      router.refresh();
    });
  }

  return (
    <DetailSection
      title="Guarantors"
      actions={
        <div className="flex flex-wrap gap-2">
          {context.canRecover ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setRecoverOpen(true)}>
              Recover guarantees
            </Button>
          ) : null}
          {context.canCreate ? (
            <Button type="button" size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add guarantor
            </Button>
          ) : null}
        </div>
      }
    >
      {shortfall ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Still short of the product guarantee: own funds{' '}
          {formatAccountMoney(shortfall.ownFundsShort, currencyCode)}, other guarantors{' '}
          {formatAccountMoney(shortfall.otherShort, currencyCode)}, combined{' '}
          {formatAccountMoney(shortfall.mandatoryShort, currencyCode)}.
        </p>
      ) : null}
      {actionError ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}
      <DataTable
        table={table}
        stickyHeader={false}
        emptyMessage="No guarantors on this loan."
        emptyDescription="Add a guarantor to back this loan."
      />
      <LoanAccountGuarantorSheet
        clientId={clientId}
        accountId={account.id}
        loanProductId={account.loanProductId}
        borrowerClientId={account.clientId}
        principal={principal}
        currencyCode={currencyCode}
        existingGuarantors={context.items}
        open={open}
        onOpenChange={setOpen}
        editing={editing}
      />
      <Dialog open={deleteTarget != null} onOpenChange={(openDialog) => !openDialog && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.kind === 'funding' ? 'Remove pledge' : 'Remove guarantor'}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.kind === 'funding'
                ? `The savings hold on ${deleteTarget.label} will be released. The guarantor stays on the loan until every pledge is removed.`
                : 'This guarantor will be marked removed. The row stays on the loan.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={handleDeleteConfirm}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={recoverOpen} onOpenChange={setRecoverOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recover guarantees</DialogTitle>
            <DialogDescription>
              Active pledged savings will be transferred onto this loan as a repayment, and those
              guarantees will be released.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRecoverOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={handleRecover}>
              Recover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailSection>
  );
}

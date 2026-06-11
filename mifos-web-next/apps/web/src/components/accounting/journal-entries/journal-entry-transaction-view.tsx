'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import { Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { revertJournalEntryAction } from '@/actions/journal-entries';
import {
  DetailBackLink,
  DetailField,
  DetailFieldGrid,
  DetailHeader,
  DetailPage
} from '@/components/composites';
import { JournalEntryLineDialog } from '@/components/accounting/journal-entries/journal-entry-line-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import {
  formatJournalEntryAmount,
  formatJournalEntryDate,
  formatJournalEntryDateTime
} from '@/lib/accounting/journal-entry-display';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';

function yesNoLabel(value: boolean | undefined) {
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  return '—';
}

export function JournalEntryTransactionView({
  transactionId,
  entries
}: {
  transactionId: string;
  entries: FineractJournalEntryListItem[];
}) {
  const router = useRouter();
  const [selectedEntry, setSelectedEntry] = useState<FineractJournalEntryListItem | null>(null);
  const [revertOpen, setRevertOpen] = useState(false);
  const [revertComments, setRevertComments] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const summary = entries[0];
  const isManual = summary?.manualEntry === true;
  const isReversed = summary?.reversed === true;

  const columns = useMemo<ColumnDef<FineractJournalEntryListItem>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Entry ID',
        cell: ({ row }) => (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => setSelectedEntry(row.original)}
          >
            {row.original.id}
          </Button>
        )
      },
      {
        id: 'glAccountType',
        accessorFn: (row) => row.glAccountType.value,
        header: 'Type',
        cell: ({ row }) => row.original.glAccountType.value
      },
      {
        accessorKey: 'glAccountCode',
        header: 'Account code',
        cell: ({ row }) => row.original.glAccountCode
      },
      {
        accessorKey: 'glAccountName',
        header: 'Account name',
        cell: ({ row }) => row.original.glAccountName
      },
      {
        id: 'debit',
        header: 'Debit',
        cell: ({ row }) => formatJournalEntryAmount(row.original, 'DEBIT')
      },
      {
        id: 'credit',
        header: 'Credit',
        cell: ({ row }) => formatJournalEntryAmount(row.original, 'CREDIT')
      }
    ],
    [setSelectedEntry]
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function handleRevert() {
    setActionError(null);
    startTransition(async () => {
      const result = await revertJournalEntryAction(transactionId, {
        comments: revertComments.trim() || undefined
      });
      if (!result.ok) {
        setActionError(result.message);
        toast.error(result.message);
        return;
      }

      toast.success('Transaction reversed.');
      setRevertOpen(false);
      setRevertComments('');

      if (result.transactionId && result.transactionId !== transactionId) {
        router.push(`/accounting/journal-entries/transactions/${result.transactionId}`);
      } else {
        router.refresh();
      }
    });
  }

  if (!summary) {
    return (
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href="/accounting/journal-entries" label="Back to journal entries" />
            }
            title="Transaction not found"
            meta={transactionId}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          No journal entries were returned for this transaction.
        </p>
      </DetailPage>
    );
  }

  return (
    <>
      <DetailPage
        header={
          <DetailHeader
            backLink={
              <DetailBackLink href="/accounting/journal-entries" label="Back to journal entries" />
            }
            title={`Transaction ${transactionId}`}
            meta={summary.officeName}
            actions={
              isManual ? (
                <Can permission="REVERSE_JOURNALENTRY">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setRevertOpen(true)}
                    disabled={pending || isReversed}
                  >
                    <Undo2 className="mr-2 size-4" />
                    {isReversed ? 'Transaction reversed' : 'Revert transaction'}
                  </Button>
                </Can>
              ) : null
            }
          />
        }
        summary={
          <DetailFieldGrid columns={2}>
            <DetailField label="Branch">{summary.officeName}</DetailField>
            <DetailField label="Transaction date">
              {formatJournalEntryDate(summary.transactionDate)}
            </DetailField>
            <DetailField label="Created by">{summary.createdByUserName ?? '—'}</DetailField>
            <DetailField label="Submitted on">
              {formatJournalEntryDateTime(summary.submittedOnDate)}
            </DetailField>
            <DetailField label="Manual entry">{yesNoLabel(summary.manualEntry)}</DetailField>
            {summary.externalAssetOwner ? (
              <DetailField label="External asset owner">{summary.externalAssetOwner}</DetailField>
            ) : null}
            {summary.referenceNumber ? (
              <DetailField label="Reference number">{summary.referenceNumber}</DetailField>
            ) : null}
            {summary.comments ? <DetailField label="Comments">{summary.comments}</DetailField> : null}
          </DetailFieldGrid>
        }
      >
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <DataTable table={table} stickyHeader={false} emptyMessage="No lines in this transaction." />
        </div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </DetailPage>

      <JournalEntryLineDialog
        entry={selectedEntry}
        open={selectedEntry !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(null);
          }
        }}
      />

      <Can permission="REVERSE_JOURNALENTRY">
        <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revert transaction</DialogTitle>
              <DialogDescription>
                Reverse transaction {transactionId}? This creates an offsetting journal entry.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label htmlFor="revert-comments" className="text-sm font-medium">
                Comments
              </label>
              <Textarea
                id="revert-comments"
                value={revertComments}
                onChange={(event) => setRevertComments(event.target.value)}
                rows={3}
                disabled={pending}
                placeholder="Optional comments"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevertOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleRevert} disabled={pending}>
                {pending ? 'Reversing…' : 'Revert'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Can>
    </>
  );
}

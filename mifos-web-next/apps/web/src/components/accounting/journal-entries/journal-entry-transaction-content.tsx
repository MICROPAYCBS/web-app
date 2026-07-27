'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractJournalEntryListItem } from '@mifos/api-client';
import { Can, useCan } from '@mifos/auth';
import { JOURNAL_ENTRY_NARRATION_MAX_LENGTH } from '@mifos/validation';
import { Pencil, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import {
  revertJournalEntryAction,
  updateJournalEntryLineNarrationAction,
  updateJournalEntryNarrationAction
} from '@/actions/journal-entries';
import { JournalEntryLineDialog } from '@/components/accounting/journal-entries/journal-entry-line-dialog';
import { DataTable } from '@/components/composites/data-table/data-table';
import { DetailField, DetailFieldGrid } from '@/components/composites';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  formatJournalEntryAmount,
  formatJournalEntryDate,
  formatJournalEntryDateTime,
  formatJournalEntryDepartment
} from '@/lib/accounting/journal-entry-display';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table';

const REVERSED_NARRATION_HINT =
  'Reversed transactions cannot be edited — reverse creates a new transaction.';

function yesNoLabel(value: boolean | undefined) {
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  return '—';
}

function resolveTransactionComments(entries: FineractJournalEntryListItem[]): string {
  const unreversed = entries.find((entry) => entry.reversed !== true);
  const source = unreversed ?? entries[0];
  return source?.transactionComments ?? '';
}

export function JournalEntryTransactionContent({
  transactionId,
  entries,
  onReverted
}: {
  transactionId: string;
  entries: FineractJournalEntryListItem[];
  onReverted?: (result: { transactionId?: string }) => void;
}) {
  const router = useRouter();
  const canUpdateNarration = useCan('UPDATE_JOURNALENTRY');
  const [selectedEntry, setSelectedEntry] = useState<FineractJournalEntryListItem | null>(null);
  const [revertOpen, setRevertOpen] = useState(false);
  const [revertComments, setRevertComments] = useState('');
  const [transactionNarrationOpen, setTransactionNarrationOpen] = useState(false);
  const [transactionNarrationDraft, setTransactionNarrationDraft] = useState('');
  const [transactionNarrationError, setTransactionNarrationError] = useState<string | null>(null);
  const [lineNarrationEntry, setLineNarrationEntry] =
    useState<FineractJournalEntryListItem | null>(null);
  const [lineNarrationDraft, setLineNarrationDraft] = useState('');
  const [lineNarrationError, setLineNarrationError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const summary = entries[0];
  const isManual = summary?.manualEntry === true;
  const isReversed = summary?.reversed === true || !entries.some((entry) => entry.reversed !== true);
  const canEditNarrations = isManual && !isReversed && canUpdateNarration;
  const currentTransactionComments = useMemo(
    () => resolveTransactionComments(entries),
    [entries]
  );
  const branchLabels = useMemo(() => {
    const names = new Set<string>();
    for (const entry of entries) {
      const name = entry.officeName?.trim();
      if (name) {
        names.add(name);
      }
    }
    return [...names];
  }, [entries]);
  const branchSummaryLabel =
    branchLabels.length === 0
      ? '—'
      : branchLabels.length === 1
        ? branchLabels[0]
        : branchLabels.join(' · ');
  const departmentLabel = summary ? formatJournalEntryDepartment(summary) : null;

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
        accessorKey: 'officeName',
        header: 'Branch',
        cell: ({ row }) => row.original.officeName
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
      },
      {
        id: 'comments',
        header: 'Line narration',
        cell: ({ row }) => {
          const entry = row.original;
          const lineReversed = entry.reversed === true;
          return (
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 whitespace-pre-wrap break-words text-sm">
                {entry.comments?.trim() ? entry.comments : '—'}
              </span>
              {canEditNarrations && !lineReversed ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  aria-label={`Edit line narration for entry ${entry.id}`}
                  disabled={pending}
                  onClick={() => {
                    setActionError(null);
                    setLineNarrationError(null);
                    setLineNarrationEntry(entry);
                    setLineNarrationDraft(entry.comments ?? '');
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
              ) : null}
            </div>
          );
        }
      }
    ],
    [canEditNarrations, pending]
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  function openTransactionNarrationEditor() {
    setActionError(null);
    setTransactionNarrationError(null);
    setTransactionNarrationDraft(currentTransactionComments);
    setTransactionNarrationOpen(true);
  }

  function refreshAfterMutation(nextTransactionId?: string) {
    if (onReverted) {
      onReverted({ transactionId: nextTransactionId ?? transactionId });
      return;
    }

    if (nextTransactionId && nextTransactionId !== transactionId) {
      router.push(`/accounting/journal-entries/transactions/${nextTransactionId}`);
    } else {
      router.refresh();
    }
  }

  function handleRevert() {
    setActionError(null);
    startTransition(async () => {
      const result = await revertJournalEntryAction(transactionId, {
        comments: revertComments.trim() || undefined
      });
      if (!result.ok) {
        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }

      toastCommandOutcome(result, {
        completed: 'Transaction reversed.',
        pending: 'Transaction reversal sent for approval.'
      });
      setRevertOpen(false);
      setRevertComments('');
      refreshAfterMutation(result.transactionId);
    });
  }

  function handleUpdateTransactionNarration() {
    setActionError(null);
    setTransactionNarrationError(null);

    if (transactionNarrationDraft.length > JOURNAL_ENTRY_NARRATION_MAX_LENGTH) {
      setTransactionNarrationError(
        `Narration must be at most ${JOURNAL_ENTRY_NARRATION_MAX_LENGTH} characters.`
      );
      return;
    }

    startTransition(async () => {
      const result = await updateJournalEntryNarrationAction(transactionId, {
        transactionComments: transactionNarrationDraft
      });
      if (!result.ok) {
        const fieldMessage = result.fieldErrors?.transactionComments ?? result.message;
        setTransactionNarrationError(fieldMessage);
        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }

      toastCommandOutcome(result, {
        completed: 'Transaction narration updated.',
        pending: 'Transaction narration update sent for approval.'
      });
      setTransactionNarrationOpen(false);
      refreshAfterMutation(result.transactionId);
    });
  }

  function handleUpdateLineNarration() {
    if (!lineNarrationEntry) {
      return;
    }

    setActionError(null);
    setLineNarrationError(null);

    if (lineNarrationDraft.length > JOURNAL_ENTRY_NARRATION_MAX_LENGTH) {
      setLineNarrationError(
        `Narration must be at most ${JOURNAL_ENTRY_NARRATION_MAX_LENGTH} characters.`
      );
      return;
    }

    const journalEntryId = lineNarrationEntry.id;
    startTransition(async () => {
      const result = await updateJournalEntryLineNarrationAction(journalEntryId, {
        comments: lineNarrationDraft
      });
      if (!result.ok) {
        const fieldMessage = result.fieldErrors?.comments ?? result.message;
        setLineNarrationError(fieldMessage);
        setActionError(result.message);
        toastFineractError(result.message);
        return;
      }

      toastCommandOutcome(result, {
        completed: 'Line narration updated.',
        pending: 'Line narration update sent for approval.'
      });
      setLineNarrationEntry(null);
      refreshAfterMutation(result.transactionId || transactionId);
    });
  }

  if (!summary) {
    return (
      <p className="text-sm text-muted-foreground">
        No journal entries were returned for transaction {transactionId}.
      </p>
    );
  }

  const editTransactionNarrationButton = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={openTransactionNarrationEditor}
      disabled={pending || isReversed}
      aria-label="Edit transaction narration"
    >
      <Pencil className="mr-2 size-4" />
      Edit transaction narration
    </Button>
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">{branchSummaryLabel}</p>
          <div className="flex flex-wrap items-center gap-2">
            {isManual ? (
              <>
                <Can permission="UPDATE_JOURNALENTRY">
                  {isReversed ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={<span className="inline-flex cursor-not-allowed" />}
                      >
                        {editTransactionNarrationButton}
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs text-pretty">
                        {REVERSED_NARRATION_HINT}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    editTransactionNarrationButton
                  )}
                </Can>
                <Can permission="REVERSE_JOURNALENTRY">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setRevertOpen(true)}
                    disabled={pending || isReversed}
                  >
                    <Undo2 className="mr-2 size-4" />
                    {isReversed ? 'Transaction reversed' : 'Revert transaction'}
                  </Button>
                </Can>
              </>
            ) : null}
          </div>
        </div>

        <DetailFieldGrid columns={2}>
          <DetailField label="Branch">{branchSummaryLabel}</DetailField>
          {departmentLabel ? (
            <DetailField label="Department">{departmentLabel}</DetailField>
          ) : null}
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
          <DetailField label="Transaction narration">
            {currentTransactionComments || '—'}
          </DetailField>
        </DetailFieldGrid>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <DataTable table={table} stickyHeader={false} emptyMessage="No lines in this transaction." />
        </div>

        {actionError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
      </div>

      <JournalEntryLineDialog
        entry={selectedEntry}
        open={selectedEntry !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(null);
          }
        }}
      />

      <Can permission="UPDATE_JOURNALENTRY">
        <Dialog
          open={transactionNarrationOpen}
          onOpenChange={(open) => {
            setTransactionNarrationOpen(open);
            if (!open) {
              setTransactionNarrationError(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit transaction narration</DialogTitle>
              <DialogDescription>
                Update the shared narration for this manual transaction. Per-line narrations are
                unchanged. Amounts, accounts, and dates cannot be edited here — reverse and re-post
                to correct those.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="journal-transaction-narration" className="text-sm font-medium">
                  Transaction narration
                </label>
                <span className="text-xs text-muted-foreground">
                  {transactionNarrationDraft.length}/{JOURNAL_ENTRY_NARRATION_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id="journal-transaction-narration"
                value={transactionNarrationDraft}
                onChange={(event) => {
                  setTransactionNarrationDraft(event.target.value);
                  if (transactionNarrationError) {
                    setTransactionNarrationError(null);
                  }
                }}
                rows={4}
                disabled={pending}
                maxLength={JOURNAL_ENTRY_NARRATION_MAX_LENGTH}
                aria-invalid={transactionNarrationError ? true : undefined}
              />
              {transactionNarrationError ? (
                <p className="text-sm text-destructive">{transactionNarrationError}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransactionNarrationOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateTransactionNarration}
                disabled={pending}
              >
                {pending ? 'Saving…' : 'Save narration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={lineNarrationEntry !== null}
          onOpenChange={(open) => {
            if (!open) {
              setLineNarrationEntry(null);
              setLineNarrationError(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit line narration</DialogTitle>
              <DialogDescription>
                Update the narration for journal entry {lineNarrationEntry?.id}. Other lines and the
                shared transaction narration are unchanged.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="journal-line-narration" className="text-sm font-medium">
                  Line narration
                </label>
                <span className="text-xs text-muted-foreground">
                  {lineNarrationDraft.length}/{JOURNAL_ENTRY_NARRATION_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id="journal-line-narration"
                value={lineNarrationDraft}
                onChange={(event) => {
                  setLineNarrationDraft(event.target.value);
                  if (lineNarrationError) {
                    setLineNarrationError(null);
                  }
                }}
                rows={4}
                disabled={pending}
                maxLength={JOURNAL_ENTRY_NARRATION_MAX_LENGTH}
                aria-invalid={lineNarrationError ? true : undefined}
              />
              {lineNarrationError ? (
                <p className="text-sm text-destructive">{lineNarrationError}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLineNarrationEntry(null)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleUpdateLineNarration} disabled={pending}>
                {pending ? 'Saving…' : 'Save narration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Can>

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

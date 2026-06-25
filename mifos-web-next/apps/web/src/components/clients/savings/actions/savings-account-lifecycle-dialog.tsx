'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { executeSavingsAccountLifecycleCommandAction } from '@/actions/savings-account-command';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { SavingsAccountLifecycleCommand } from '@/lib/fineract/savings-account-command-meta';

export type SavingsAccountLifecycleDialogKind = Extract<
  SavingsAccountLifecycleCommand,
  | 'approve'
  | 'activate'
  | 'reject'
  | 'withdrawnByApplicant'
  | 'undoApproval'
  | 'unblock'
  | 'unblockCredit'
  | 'unblockDebit'
>;

const DIALOG_COPY: Record<
  SavingsAccountLifecycleDialogKind,
  { title: string; description: string; submitLabel: string; destructive?: boolean }
> = {
  approve: {
    title: 'Approve savings account',
    description: 'Confirm approval date for this account.',
    submitLabel: 'Approve'
  },
  activate: {
    title: 'Activate savings account',
    description: 'Set the date this account becomes active.',
    submitLabel: 'Activate'
  },
  reject: {
    title: 'Reject savings account',
    description: 'Reject this submitted account application.',
    submitLabel: 'Reject',
    destructive: true
  },
  withdrawnByApplicant: {
    title: 'Withdraw application',
    description: 'Record that the applicant withdrew this application.',
    submitLabel: 'Withdraw',
    destructive: true
  },
  undoApproval: {
    title: 'Undo approval',
    description: 'Return this account to submitted status.',
    submitLabel: 'Undo approval'
  },
  unblock: {
    title: 'Unblock account',
    description: 'Remove the full block on this account.',
    submitLabel: 'Unblock account'
  },
  unblockCredit: {
    title: 'Unblock deposits',
    description: 'Allow credit transactions on this account again.',
    submitLabel: 'Unblock deposits'
  },
  unblockDebit: {
    title: 'Unblock withdrawals',
    description: 'Allow debit transactions on this account again.',
    submitLabel: 'Unblock withdrawals'
  }
};

const DATE_FIELD_BY_KIND: Partial<
  Record<SavingsAccountLifecycleDialogKind, string>
> = {
  approve: 'approvedOnDate',
  activate: 'activatedOnDate',
  reject: 'rejectedOnDate',
  withdrawnByApplicant: 'withdrawnOnDate'
};

export function SavingsAccountLifecycleDialog({
  clientId,
  accountId,
  kind,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  kind: SavingsAccountLifecycleDialogKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialTransactionDate = useInitialTransactionDate();
  const [date, setDate] = useState(initialTransactionDate);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setDate(initialTransactionDate);
    setNote('');
    setError(null);
    setFieldErrors({});
  }, [open, kind, initialTransactionDate]);

  if (!kind) {
    return null;
  }

  const copy = DIALOG_COPY[kind];
  const dateField = DATE_FIELD_BY_KIND[kind];
  const showNote = kind !== 'activate' && !kind.startsWith('unblock');
  const showDate = Boolean(dateField);
  const isConfirmOnly = kind.startsWith('unblock');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload: Record<string, unknown> = {};
      if (showDate && dateField) {
        payload[dateField] = date;
      }
      if (showNote && note.trim()) {
        payload.note = note.trim();
      }

      const result = await executeSavingsAccountLifecycleCommandAction(
        clientId,
        String(accountId),
        kind as SavingsAccountLifecycleDialogKind,
        payload
      );

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {isConfirmOnly ? (
          <p className="text-sm text-muted-foreground">
            This will restore transaction access according to the unblock type you selected.
          </p>
        ) : (
          <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            {showDate ? (
              <TransactionDateField
                id={`${formId}-date`}
                label="Date"
                value={date}
                onChange={setDate}
                error={fieldErrors.approvedOnDate ?? fieldErrors.activatedOnDate ?? fieldErrors.rejectedOnDate ?? fieldErrors.withdrawnOnDate}
                required
              />
            ) : null}
            {showNote ? (
              <TextField
                id={`${formId}-note`}
                label="Note"
                value={note}
                onChange={setNote}
                error={fieldErrors.note}
                multiline
              />
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type={isConfirmOnly ? 'button' : 'submit'}
            form={isConfirmOnly ? undefined : formId}
            variant={copy.destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={
              isConfirmOnly
                ? () => {
                    const fakeEvent = { preventDefault: () => undefined } as React.FormEvent;
                    handleSubmit(fakeEvent);
                  }
                : undefined
            }
          >
            {copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

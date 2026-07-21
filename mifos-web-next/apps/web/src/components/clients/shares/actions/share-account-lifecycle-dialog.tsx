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
import { executeShareAccountLifecycleCommandAction } from '@/actions/share-account-command';
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
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { SHARE_LIFECYCLE_COMMAND_TOAST } from '@/lib/fineract/share-account-command-toasts';

export type ShareAccountLifecycleDialogKind =
  | 'approve'
  | 'activate'
  | 'reject'
  | 'undoApproval';

const DIALOG_COPY: Record<
  ShareAccountLifecycleDialogKind,
  { title: string; description: string; submitLabel: string; destructive?: boolean }
> = {
  approve: {
    title: 'Approve share account',
    description: 'Confirm the approval date for this application.',
    submitLabel: 'Approve'
  },
  activate: {
    title: 'Activate share account',
    description: 'Set the date this share account becomes active.',
    submitLabel: 'Activate'
  },
  reject: {
    title: 'Reject share account',
    description: 'Reject this submitted share account application.',
    submitLabel: 'Reject',
    destructive: true
  },
  undoApproval: {
    title: 'Undo approval',
    description: 'Return this account to submitted status.',
    submitLabel: 'Undo approval'
  }
};

const DATE_FIELD: Partial<Record<ShareAccountLifecycleDialogKind, string>> = {
  approve: 'approvedDate',
  activate: 'activatedDate',
  reject: 'rejectedDate'
};

const TOAST_KEY: Record<
  ShareAccountLifecycleDialogKind,
  keyof typeof SHARE_LIFECYCLE_COMMAND_TOAST
> = {
  approve: 'approve',
  activate: 'activate',
  reject: 'reject',
  undoApproval: 'undoApproval'
};

export function ShareAccountLifecycleDialog({
  open,
  onOpenChange,
  kind,
  clientId,
  accountId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ShareAccountLifecycleDialogKind | null;
  clientId: string;
  accountId: number;
}) {
  const router = useRouter();
  const formId = useId();
  const initialDate = useInitialTransactionDate();
  const [date, setDate] = useState(initialDate);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !kind) {
      return;
    }
    setDate(initialDate);
    setNote('');
    setError(null);
    setFieldErrors({});
  }, [open, kind, initialDate]);

  if (!kind) {
    return null;
  }

  const activeKind = kind;
  const copy = DIALOG_COPY[activeKind];
  const dateField = DATE_FIELD[activeKind];
  const showDate = Boolean(dateField);
  const showNote =
    activeKind === 'approve' || activeKind === 'reject' || activeKind === 'undoApproval';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

      const command = activeKind === 'undoApproval' ? 'undoapproval' : activeKind;

      const result = await executeShareAccountLifecycleCommandAction(
        clientId,
        String(accountId),
        command,
        payload
      );

      if (!toastCommandOutcome(result, SHARE_LIFECYCLE_COMMAND_TOAST[TOAST_KEY[activeKind]])) {
        if (!result.ok) {
          setError(formatActionErrorMessage(result.message, result.fieldErrors));
          setFieldErrors(result.fieldErrors ?? {});
        }
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
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {showDate ? (
            <TransactionDateField
              id={`${formId}-date`}
              label="Date"
              value={date}
              onChange={setDate}
              error={dateField ? fieldErrors[dateField] : undefined}
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
            />
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={pending}
            variant={copy.destructive ? 'destructive' : 'default'}
          >
            {pending ? 'Saving…' : copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

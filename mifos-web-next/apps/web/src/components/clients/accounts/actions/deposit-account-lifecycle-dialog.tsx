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
import { executeDepositAccountLifecycleCommandAction } from '@/actions/deposit-account-command';
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
import { depositLifecycleCommandToast } from '@/lib/fineract/deposit-account-command-toasts';
import type { DepositAccountLifecycleCommand } from '@/lib/fineract/deposit-account-command-meta';
import {
  depositAccountKindLabel,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';

export type DepositAccountLifecycleDialogKind = Extract<
  DepositAccountLifecycleCommand,
  | 'approve'
  | 'activate'
  | 'reject'
  | 'withdrawnByApplicant'
  | 'undoApproval'
  | 'undoActivation'
>;

function dialogCopy(
  kind: DepositAccountLifecycleDialogKind,
  accountKind: TermDepositAccountKind
): { title: string; description: string; submitLabel: string; destructive?: boolean } {
  const label = depositAccountKindLabel(accountKind);
  const map: Record<
    DepositAccountLifecycleDialogKind,
    { title: string; description: string; submitLabel: string; destructive?: boolean }
  > = {
    approve: {
      title: `Approve ${label}`,
      description: 'Confirm the approval date for this account.',
      submitLabel: 'Approve'
    },
    activate: {
      title: `Activate ${label}`,
      description: 'Set the date this account becomes active.',
      submitLabel: 'Activate'
    },
    reject: {
      title: `Reject ${label}`,
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
    undoActivation: {
      title: 'Undo activation',
      description: 'Return this account to approved status.',
      submitLabel: 'Undo activation'
    }
  };
  return map[kind];
}

const DATE_FIELD_BY_KIND: Partial<Record<DepositAccountLifecycleDialogKind, string>> = {
  approve: 'approvedOnDate',
  activate: 'activatedOnDate',
  reject: 'rejectedOnDate',
  withdrawnByApplicant: 'withdrawnOnDate'
};

export function DepositAccountLifecycleDialog({
  kind: accountKind,
  clientId,
  accountId,
  dialogKind,
  open,
  onOpenChange
}: {
  kind: TermDepositAccountKind;
  clientId: string;
  accountId: number;
  dialogKind: DepositAccountLifecycleDialogKind | null;
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
  }, [open, dialogKind, initialTransactionDate]);

  if (!dialogKind) {
    return null;
  }

  const copy = dialogCopy(dialogKind, accountKind);
  const dateField = DATE_FIELD_BY_KIND[dialogKind];
  const showNote = dialogKind !== 'activate';
  const showDate = Boolean(dateField);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      if (!dialogKind) {
        return;
      }
      const payload: Record<string, unknown> = {};
      if (showDate && dateField) {
        payload[dateField] = date;
      }
      if (showNote && note.trim()) {
        payload.note = note.trim();
      }

      const result = await executeDepositAccountLifecycleCommandAction(
        accountKind,
        clientId,
        String(accountId),
        dialogKind,
        payload
      );

      if (!toastCommandOutcome(result, depositLifecycleCommandToast(accountKind, dialogKind))) {
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
              error={
                fieldErrors.approvedOnDate ??
                fieldErrors.activatedOnDate ??
                fieldErrors.rejectedOnDate ??
                fieldErrors.withdrawnOnDate
              }
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant={copy.destructive ? 'destructive' : 'default'}
            disabled={pending}
          >
            {copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

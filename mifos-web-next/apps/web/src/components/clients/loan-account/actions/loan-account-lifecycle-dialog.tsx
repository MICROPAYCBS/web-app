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
import { executeLoanAccountLifecycleCommandAction } from '@/actions/loan-account-command';
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

export type LoanAccountLifecycleDialogKind =
  | 'reject'
  | 'withdraw'
  | 'undoApproval'
  | 'undoDisbursal';

const DIALOG_COPY: Record<
  LoanAccountLifecycleDialogKind,
  { title: string; description: string; submitLabel: string; destructive?: boolean }
> = {
  reject: {
    title: 'Reject loan application',
    description: 'Reject this submitted loan application.',
    submitLabel: 'Reject',
    destructive: true
  },
  withdraw: {
    title: 'Withdraw application',
    description: 'Record that the applicant withdrew this loan application.',
    submitLabel: 'Withdraw',
    destructive: true
  },
  undoApproval: {
    title: 'Undo approval',
    description: 'Return this loan to submitted status.',
    submitLabel: 'Undo approval'
  },
  undoDisbursal: {
    title: 'Undo disbursal',
    description: 'Reverse the last disbursement on this loan. A note is required.',
    submitLabel: 'Undo disbursal',
    destructive: true
  }
};

const COMMAND_BY_KIND = {
  reject: 'reject',
  withdraw: 'withdrawnByApplicant',
  undoApproval: 'undoapproval',
  undoDisbursal: 'undodisbursal'
} as const;

const DATE_FIELD_BY_KIND: Partial<Record<LoanAccountLifecycleDialogKind, string>> = {
  reject: 'rejectedOnDate',
  withdraw: 'withdrawnOnDate'
};

export function LoanAccountLifecycleDialog({
  clientId,
  accountId,
  kind,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  kind: LoanAccountLifecycleDialogKind | null;
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
  const showDate = Boolean(dateField);
  const noteRequired = kind === 'undoDisbursal';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      if (!kind) {
        return;
      }
      const activeKind = kind;
      const payload: Record<string, unknown> = {};
      if (showDate && dateField) {
        payload[dateField] = date;
      }
      if (note.trim() || noteRequired) {
        payload.note = note.trim();
      }

      const result = await executeLoanAccountLifecycleCommandAction(
        clientId,
        String(accountId),
        COMMAND_BY_KIND[activeKind],
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

        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {showDate ? (
            <TransactionDateField
              id={`${formId}-date`}
              label="Date"
              value={date}
              onChange={setDate}
              error={
                fieldErrors.rejectedOnDate ??
                fieldErrors.withdrawnOnDate
              }
              required
            />
          ) : null}
          <TextField
            id={`${formId}-note`}
            label={noteRequired ? 'Note' : 'Note (optional)'}
            value={note}
            onChange={setNote}
            error={fieldErrors.note}
            multiline
            required={noteRequired}
          />
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

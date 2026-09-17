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
import {
  approveLoanRescheduleRequestAction,
  rejectLoanRescheduleRequestAction
} from '@/actions/loan-reschedule';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
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

export type LoanRescheduleDecisionKind = 'approve' | 'reject';

const COPY: Record<
  LoanRescheduleDecisionKind,
  { title: string; description: string; submitLabel: string; dateLabel: string }
> = {
  approve: {
    title: 'Approve reschedule',
    description: 'Apply this reschedule request to the loan repayment schedule.',
    submitLabel: 'Approve',
    dateLabel: 'Approved on'
  },
  reject: {
    title: 'Reject reschedule',
    description: 'Reject this reschedule request. The current schedule stays in place.',
    submitLabel: 'Reject',
    dateLabel: 'Rejected on'
  }
};

const TOAST: Record<LoanRescheduleDecisionKind, { completed: string; pending: string }> = {
  approve: {
    completed: 'Reschedule request approved.',
    pending: 'Reschedule approval submitted for checking.'
  },
  reject: {
    completed: 'Reschedule request rejected.',
    pending: 'Reschedule rejection submitted for checking.'
  }
};

export function LoanAccountRescheduleDecisionDialog({
  clientId,
  accountId,
  requestId,
  kind,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  requestId: number | null;
  kind: LoanRescheduleDecisionKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialDate = useInitialTransactionDate();
  const [decisionDate, setDecisionDate] = useState(initialDate);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const copy = kind ? COPY[kind] : COPY.approve;
  const dateField = kind === 'reject' ? 'rejectedOnDate' : 'approvedOnDate';

  useEffect(() => {
    if (!open) {
      return;
    }
    setDecisionDate(initialDate);
    setError(null);
    setFieldErrors({});
  }, [initialDate, open, requestId, kind]);

  function handleConfirm() {
    if (!kind || requestId == null) {
      return;
    }
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const payload = { [dateField]: decisionDate };
      const result =
        kind === 'approve'
          ? await approveLoanRescheduleRequestAction(
              clientId,
              String(accountId),
              String(requestId),
              payload
            )
          : await rejectLoanRescheduleRequestAction(
              clientId,
              String(accountId),
              String(requestId),
              payload
            );
      if (!toastCommandOutcome(result, TOAST[kind])) {
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
        <form
          id={formId}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleConfirm();
          }}
        >
          <TransactionDateField
            id={`${formId}-date`}
            label={copy.dateLabel}
            required
            value={decisionDate}
            onChange={setDecisionDate}
            error={fieldErrors[dateField]}
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
            variant={kind === 'reject' ? 'destructive' : 'default'}
            disabled={pending || requestId == null}
          >
            {copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

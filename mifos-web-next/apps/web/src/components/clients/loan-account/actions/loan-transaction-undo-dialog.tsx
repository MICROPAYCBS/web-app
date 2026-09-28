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
import { useState, useTransition } from 'react';
import { undoLoanTransactionAction } from '@/actions/loan-account-command';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';
import { loanTransactionDate } from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountTransaction } from '@/lib/fineract/loan-account-types';
import { loanTransactionUndoIsWriteOff } from '@/lib/fineract/loan-transaction-actions';

export function LoanTransactionUndoDialog({
  clientId,
  accountId,
  transaction,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: string | number;
  transaction: FineractLoanAccountTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const writeOff = loanTransactionUndoIsWriteOff(transaction);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await undoLoanTransactionAction({
        clientId,
        accountId: String(accountId),
        transactionId: transaction.id,
        transactionDate: fineractApiDateToFormString(loanTransactionDate(transaction)) ?? '',
        writeOff
      });

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Undo transaction</DialogTitle>
          <DialogDescription>
            Reverse this transaction on the loan. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={pending}>
            {pending ? 'Undoing…' : 'Undo transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

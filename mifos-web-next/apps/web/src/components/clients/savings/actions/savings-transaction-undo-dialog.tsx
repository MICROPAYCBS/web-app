'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  undoAccountTransferAction,
  undoSavingsTransactionAction
} from '@/actions/savings-transaction-command';
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
import { savingsTransactionDate } from '@/lib/fineract/savings-account-display';

export type SavingsTransactionUndoDialogKind = 'transaction' | 'transfer';

const COPY: Record<
  SavingsTransactionUndoDialogKind,
  { title: string; description: string; submitLabel: string }
> = {
  transaction: {
    title: 'Undo transaction',
    description: 'Reverse this transaction on the savings account. This action cannot be undone.',
    submitLabel: 'Undo transaction'
  },
  transfer: {
    title: 'Undo transfer',
    description: 'Reverse this account transfer. Both sides of the transfer will be affected.',
    submitLabel: 'Undo transfer'
  }
};

export function SavingsTransactionUndoDialog({
  clientId,
  accountId,
  transaction,
  kind,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: string | number;
  transaction: FineractSavingsAccountTransaction;
  kind: SavingsTransactionUndoDialogKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!kind) {
    return null;
  }

  const copy = COPY[kind];

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === 'transfer'
          ? await undoAccountTransferAction({
              clientId,
              accountId: String(accountId),
              transferId: transaction.transfer!.id!
            })
          : await undoSavingsTransactionAction({
              clientId,
              accountId: String(accountId),
              transactionId: transaction.id,
              transactionDate:
                fineractApiDateToFormString(savingsTransactionDate(transaction)) ?? ''
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
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={handleConfirm}>
            {copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

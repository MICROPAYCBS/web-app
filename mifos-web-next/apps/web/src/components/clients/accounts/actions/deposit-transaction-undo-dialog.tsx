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
import { undoDepositAccountTransactionAction } from '@/actions/deposit-account-command';
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
import type { TermDepositAccountKind } from '@/lib/fineract/deposit-account-display';
import { savingsTransactionDate } from '@/lib/fineract/savings-account-display';

export function DepositTransactionUndoDialog({
  kind,
  clientId,
  accountId,
  transaction,
  open,
  onOpenChange
}: {
  kind: TermDepositAccountKind;
  clientId: string;
  accountId: string | number;
  transaction: FineractSavingsAccountTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await undoDepositAccountTransactionAction(kind, {
        clientId,
        accountId: String(accountId),
        transactionId: transaction.id,
        transactionDate: fineractApiDateToFormString(savingsTransactionDate(transaction)) ?? ''
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
            Reverse this transaction on the account. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={handleConfirm}>
            Undo transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

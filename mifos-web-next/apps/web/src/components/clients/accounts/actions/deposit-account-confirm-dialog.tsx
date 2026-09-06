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
import {
  executeDepositAccountDeleteAction,
  executeDepositAccountLifecycleCommandAction
} from '@/actions/deposit-account-command';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { clientAccountListPath } from '@/lib/fineract/client-account-links';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { depositLifecycleCommandToast } from '@/lib/fineract/deposit-account-command-toasts';
import {
  depositAccountKindLabel,
  type TermDepositAccountKind
} from '@/lib/fineract/deposit-account-display';

export type DepositAccountConfirmDialogKind =
  | 'calculateInterest'
  | 'postInterest'
  | 'deleteAccount';

export function DepositAccountConfirmDialog({
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
  dialogKind: DepositAccountConfirmDialogKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!dialogKind) {
    return null;
  }

  const label = depositAccountKindLabel(accountKind);
  const copy: Record<
    DepositAccountConfirmDialogKind,
    { title: string; description: string; submitLabel: string; destructive?: boolean }
  > = {
    calculateInterest: {
      title: 'Calculate interest',
      description: `Recalculate accrued interest for this ${label}.`,
      submitLabel: 'Calculate interest'
    },
    postInterest: {
      title: 'Post interest',
      description: `Post accrued interest to this ${label}.`,
      submitLabel: 'Post interest'
    },
    deleteAccount: {
      title: `Delete ${label}`,
      description: 'Permanently delete this submitted application. This cannot be undone.',
      submitLabel: 'Delete account',
      destructive: true
    }
  };
  const activeCopy = copy[dialogKind];

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      if (!dialogKind) {
        return;
      }

      if (dialogKind === 'deleteAccount') {
        const result = await executeDepositAccountDeleteAction(
          accountKind,
          clientId,
          String(accountId)
        );
        if (!toastCommandOutcome(result, depositLifecycleCommandToast(accountKind, 'deleteAccount'))) {
          if (!result.ok) {
            setError(formatActionErrorMessage(result.message, result.fieldErrors));
          }
          return;
        }
        onOpenChange(false);
        router.push(
          clientAccountListPath(
            clientId,
            accountKind === 'fixedDeposit' ? 'fixedDeposit' : 'recurringDeposit'
          )
        );
        router.refresh();
        return;
      }

      const result = await executeDepositAccountLifecycleCommandAction(
        accountKind,
        clientId,
        String(accountId),
        dialogKind,
        {}
      );
      if (!toastCommandOutcome(result, depositLifecycleCommandToast(accountKind, dialogKind))) {
        if (!result.ok) {
          setError(formatActionErrorMessage(result.message, result.fieldErrors));
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
          <DialogTitle>{activeCopy.title}</DialogTitle>
          <DialogDescription>{activeCopy.description}</DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={activeCopy.destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={handleConfirm}
          >
            {activeCopy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  executeSavingsAccountDeleteAction,
  executeSavingsAccountLifecycleCommandAction,
  executeSavingsAccountWithholdTaxAction
} from '@/actions/savings-account-command';
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

export type SavingsAccountConfirmDialogKind =
  | 'calculateInterest'
  | 'postInterest'
  | 'deleteAccount'
  | 'enableWithholdTax'
  | 'disableWithholdTax';

const COPY: Record<
  SavingsAccountConfirmDialogKind,
  { title: string; description: string; submitLabel: string; destructive?: boolean }
> = {
  calculateInterest: {
    title: 'Calculate interest',
    description: 'Recalculate accrued interest for this savings account.',
    submitLabel: 'Calculate interest'
  },
  postInterest: {
    title: 'Post interest',
    description: 'Post accrued interest to this savings account.',
    submitLabel: 'Post interest'
  },
  deleteAccount: {
    title: 'Delete savings account',
    description: 'Permanently delete this submitted account application. This cannot be undone.',
    submitLabel: 'Delete account',
    destructive: true
  },
  enableWithholdTax: {
    title: 'Enable withhold tax',
    description: 'Withhold tax on interest postings for this account.',
    submitLabel: 'Enable withhold tax'
  },
  disableWithholdTax: {
    title: 'Disable withhold tax',
    description: 'Stop withholding tax on interest postings for this account.',
    submitLabel: 'Disable withhold tax'
  }
};

export function SavingsAccountConfirmDialog({
  clientId,
  accountId,
  kind,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  kind: SavingsAccountConfirmDialogKind | null;
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
      let result;
      if (kind === 'deleteAccount') {
        result = await executeSavingsAccountDeleteAction(clientId, String(accountId));
      } else if (kind === 'enableWithholdTax' || kind === 'disableWithholdTax') {
        result = await executeSavingsAccountWithholdTaxAction(clientId, String(accountId), {
          withHoldTax: kind === 'enableWithholdTax'
        });
      } else if (kind === 'calculateInterest' || kind === 'postInterest') {
        result = await executeSavingsAccountLifecycleCommandAction(
          clientId,
          String(accountId),
          kind,
          {}
        );
      } else {
        return;
      }

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }

      onOpenChange(false);
      if (kind === 'deleteAccount') {
        router.push(clientAccountListPath(clientId, 'savings'));
        return;
      }
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
          <Button
            type="button"
            variant={copy.destructive ? 'destructive' : 'default'}
            disabled={pending}
            onClick={handleConfirm}
          >
            {copy.submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

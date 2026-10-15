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
import { useEffect, useState, useTransition } from 'react';
import { undoMarkLoanAsNpaAction } from '@/actions/loan-account-npa';
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

export function LoanAccountUndoNpaDialog({
  clientId,
  accountId,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  function handleConfirm() {
    if (pending) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await undoMarkLoanAsNpaAction(clientId, String(accountId));
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      toastCommandOutcome(result, {
        completed: 'Deliberate classification removed.',
        pending: 'Undo mark as non-performing is awaiting approval.'
      });
      onOpenChange(false);
      if (!result.pendingChecker) {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Undo mark as NPA</DialogTitle>
          <DialogDescription>
            The reason and note will be cleared. The loan stays non-performing if it still meets the
            product overdue rule.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={handleConfirm}>
            Undo mark as NPA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

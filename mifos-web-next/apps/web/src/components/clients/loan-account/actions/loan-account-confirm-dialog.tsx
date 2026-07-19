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
import { executeLoanAccountDeleteAction } from '@/actions/loan-account-command';
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

export function LoanAccountConfirmDialog({
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

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await executeLoanAccountDeleteAction(clientId, String(accountId));
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      onOpenChange(false);
      router.push(clientAccountListPath(clientId, 'loan'));
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete loan application</DialogTitle>
          <DialogDescription>
            Permanently delete this submitted loan application. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={handleConfirm}>
            Delete loan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

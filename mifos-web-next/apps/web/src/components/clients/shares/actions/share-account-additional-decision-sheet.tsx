'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractShareAccountDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { executeShareAccountSharesCommandAction } from '@/actions/share-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { formatShareAccountDate, pendingSharePurchases } from '@/lib/fineract/share-account-display';
import { SHARE_OPS_COMMAND_TOAST } from '@/lib/fineract/share-account-command-toasts';

const FORM_ID = 'share-account-additional-decision-form';

export function ShareAccountAdditionalDecisionSheet({
  open,
  onOpenChange,
  clientId,
  account,
  kind
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  account: FineractShareAccountDetail;
  kind: 'approveAdditional' | 'rejectAdditional';
}) {
  const router = useRouter();
  const pendingRows = useMemo(() => pendingSharePurchases(account), [account]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isReject = kind === 'rejectAdditional';

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedIds([]);
    setError(null);
  }, [open, kind]);

  function toggleId(id: number, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await executeShareAccountSharesCommandAction(
        clientId,
        String(account.id),
        isReject ? 'rejectadditionalshares' : 'approveadditionalshares',
        {
          requestedShares: selectedIds.map((id) => ({ id }))
        }
      );
      if (
        !toastCommandOutcome(
          result,
          isReject
            ? SHARE_OPS_COMMAND_TOAST.rejectAdditional
            : SHARE_OPS_COMMAND_TOAST.approveAdditional
        )
      ) {
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
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isReject ? 'Reject additional shares' : 'Approve additional shares'}
      description="Select pending purchase requests to process."
      formId={FORM_ID}
      submitLabel={isReject ? 'Reject selected' : 'Approve selected'}
      submitLoading={pending}
      submitDisabled={selectedIds.length === 0}
    >
      {error ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form id={FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
        {pendingRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending share purchases.</p>
        ) : (
          <ul className="space-y-3">
            {pendingRows.map((row) => {
              const checked = selectedIds.includes(row.id);
              const id = `pending-share-${row.id}`;
              return (
                <li key={row.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(value) => toggleId(row.id, value === true)}
                  />
                  <Label htmlFor={id} className="cursor-pointer space-y-1 font-normal">
                    <span className="block font-medium">
                      {row.numberOfShares ?? 0} shares · {formatShareAccountDate(row.purchasedDate)}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      Transaction #{row.id}
                    </span>
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
      </form>
    </FormSheet>
  );
}

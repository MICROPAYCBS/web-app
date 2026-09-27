'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountCharge, SavingsAccountPaymentChannel } from '@mifos/api-client';
import { useCan } from '@mifos/auth';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  executeSavingsAccountPayChargeAction,
  executeSavingsAccountWaiveChargeAction
} from '@/actions/savings-account-command';
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
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { savingsChargeActions } from '@/lib/fineract/channel-charge-timing';
import { fineractApiDateToFormString } from '@/lib/fineract/dates';

export function SavingsAccountChargeActions({
  charge,
  clientId,
  accountId,
  channels
}: {
  charge: FineractSavingsAccountCharge;
  clientId: string;
  accountId: number;
  channels: SavingsAccountPaymentChannel[];
}) {
  const router = useRouter();
  const businessDate = useInitialTransactionDate();
  const canPay = useCan(['PAY_SAVINGSACCOUNTCHARGE', 'APPLYANNUALFEE_SAVINGSACCOUNT']);
  const canWaive = useCan('WAIVE_SAVINGSACCOUNTCHARGE');
  const actions = savingsChargeActions(charge, channels);
  const [mode, setMode] = useState<'pay' | 'waive' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const showPay = actions.canPay && canPay;
  const showWaive = actions.canWaive && canWaive;
  if (!showPay && !showWaive) {
    return null;
  }

  function handleConfirm() {
    if (!mode) {
      return;
    }
    setError(null);
    const command = mode;
    startTransition(async () => {
      const result =
        command === 'pay'
          ? await executeSavingsAccountPayChargeAction(clientId, String(accountId), {
              chargeId: charge.id,
              dueDate: fineractApiDateToFormString(charge.dueDate) ?? businessDate,
              amount: charge.amountOutstanding
            })
          : await executeSavingsAccountWaiveChargeAction(clientId, String(accountId), {
              chargeId: charge.id
            });
      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      setMode(null);
      toastCommandOutcome(result, {
        completed: command === 'pay' ? 'Charge paid.' : 'Charge waived.',
        pending: 'Sent for approval.'
      });
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {showPay ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setMode('pay')}>
            Pay
          </Button>
        ) : null}
        {showWaive ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setMode('waive')}>
            Waive
          </Button>
        ) : null}
      </div>
      <Dialog
        open={mode != null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setMode(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'waive' ? 'Waive charge' : 'Pay charge'}</DialogTitle>
            <DialogDescription>
              {mode === 'waive'
                ? `Waive the outstanding amount on ${charge.name}.`
                : `Pay the outstanding amount on ${charge.name}.`}
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setMode(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={handleConfirm}>
              {pending ? 'Saving…' : mode === 'waive' ? 'Waive' : 'Pay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

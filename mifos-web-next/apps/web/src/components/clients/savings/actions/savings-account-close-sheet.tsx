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
  executeSavingsAccountLifecycleCommandAction,
  loadSavingsAccountTransactionSheetDataAction
} from '@/actions/savings-account-command';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { dateToFineract } from '@/lib/fineract/date-input';

export function SavingsAccountCloseSheet({
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
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState<{ id: number; name: string }[]>([]);
  const [closedOnDate, setClosedOnDate] = useState(() => dateToFineract(new Date()));
  const [withdrawBalance, setWithdrawBalance] = useState(false);
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setClosedOnDate(dateToFineract(new Date()));
    setWithdrawBalance(false);
    setPaymentTypeId('');
    setNote('');
    void loadSavingsAccountTransactionSheetDataAction(String(accountId), 'deposit').then(
      (result) => {
        if (cancelled) {
          return;
        }
        setLoading(false);
        if (!result.ok) {
          setError(result.message);
          setPaymentTypes([]);
          return;
        }
        setPaymentTypes(result.paymentTypeOptions);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [open, accountId]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountLifecycleCommandAction(
        clientId,
        String(accountId),
        'close',
        {
          closedOnDate,
          note: note.trim() || undefined,
          withdrawBalance,
          paymentTypeId: withdrawBalance ? paymentTypeId : undefined
        }
      );

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
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
      title="Close account"
      description="Close this savings account. You can optionally withdraw the remaining balance."
      formId={formId}
      submitLabel="Close account"
      submitLoading={pending}
      submitDisabled={loading}
      className="data-[side=right]:sm:max-w-lg"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <DateField
            id={`${formId}-closed-on`}
            label="Closed on"
            value={closedOnDate}
            onChange={setClosedOnDate}
            error={fieldErrors.closedOnDate}
            required
          />
          <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <div className="space-y-0.5">
              <Label htmlFor={`${formId}-withdraw-balance`}>Withdraw balance</Label>
              <p className="text-xs text-muted-foreground">
                Pay out the remaining balance when closing.
              </p>
            </div>
            <Switch
              id={`${formId}-withdraw-balance`}
              checked={withdrawBalance}
              onCheckedChange={setWithdrawBalance}
            />
          </div>
          {withdrawBalance ? (
            <SelectField
              id={`${formId}-payment-type`}
              label="Payment type"
              value={paymentTypeId}
              onValueChange={(value) => setPaymentTypeId(value ?? '')}
              options={paymentTypes.map((row) => ({ value: String(row.id), label: row.name }))}
              placeholder="Select payment type"
              error={fieldErrors.paymentTypeId}
              required
            />
          ) : null}
          <TextField
            id={`${formId}-note`}
            label="Note"
            value={note}
            onChange={setNote}
            error={fieldErrors.note}
            multiline
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      )}
    </FormSheet>
  );
}

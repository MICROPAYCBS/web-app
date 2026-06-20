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
  executeSavingsAccountTransactionCommandAction,
  loadSavingsAccountTransactionSheetDataAction
} from '@/actions/savings-account-command';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import type { SavingsAccountTransactionCommand } from '@/lib/fineract/savings-account-commands';
import { dateToFineract } from '@/lib/fineract/date-input';

export function SavingsAccountTransactionSheet({
  clientId,
  accountId,
  command,
  currencyCode,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  command: SavingsAccountTransactionCommand | null;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState<{ id: number; name: string }[]>([]);
  const [transactionDate, setTransactionDate] = useState(() => dateToFineract(new Date()));
  const [amount, setAmount] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isDeposit = command === 'deposit';
  const title = isDeposit ? 'Deposit' : 'Withdraw';
  const description = isDeposit
    ? 'Post a deposit to this savings account.'
    : 'Withdraw funds from this savings account.';

  useEffect(() => {
    if (!open || !command) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setTransactionDate(dateToFineract(new Date()));
    setAmount('');
    setPaymentTypeId('');
    setNote('');
    void loadSavingsAccountTransactionSheetDataAction(String(accountId), command).then((result) => {
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
      const cash = result.paymentTypeOptions.find((row) =>
        row.name.toLowerCase().includes('cash')
      );
      const defaultId = cash?.id ?? result.paymentTypeOptions[0]?.id;
      if (defaultId) {
        setPaymentTypeId(String(defaultId));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, command, accountId]);

  if (!command) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountTransactionCommandAction(
        clientId,
        String(accountId),
        command as SavingsAccountTransactionCommand,
        {
          transactionDate,
          transactionAmount: amount,
          paymentTypeId,
          note: note.trim() || undefined
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
      title={title}
      description={description}
      formId={formId}
      submitLabel={title}
      submitLoading={pending}
      submitDisabled={loading}
      className="data-[side=right]:sm:max-w-lg"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading payment types…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <DateField
            id={`${formId}-date`}
            label="Transaction date"
            value={transactionDate}
            onChange={setTransactionDate}
            error={fieldErrors.transactionDate}
            required
          />
          <MoneyField
            id={`${formId}-amount`}
            label="Amount"
            value={amount}
            onChange={setAmount}
            currencyCode={currencyCode}
            error={fieldErrors.transactionAmount}
            required
          />
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

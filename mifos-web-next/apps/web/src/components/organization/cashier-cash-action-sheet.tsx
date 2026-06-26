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
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { allocateCashierCashAction, settleCashierCashAction } from '@/actions/cashier';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';

export function CashierCashActionSheet({
  open,
  onOpenChange,
  mode,
  tellerId,
  cashierId,
  currencyCode
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'allocate' | 'settle';
  tellerId: string | number;
  cashierId: string | number;
  currencyCode: string;
}) {
  const router = useRouter();
  const formId = useId();
  const initialTransactionDate = useInitialTransactionDate();
  const [txnDate, setTxnDate] = useState(initialTransactionDate);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAllocate = mode === 'allocate';
  const title = isAllocate ? 'Allocate cash' : 'Settle cash';
  const descriptionText = isAllocate
    ? 'Transfer cash from the vault to this cashier.'
    : 'Settle cash from this cashier back to the vault.';

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTxnDate(initialTransactionDate);
      setAmount('');
      setDescription('');
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload = {
        currencyCode,
        txnAmount: amount,
        txnDate,
        description
      };

      const result = isAllocate
        ? await allocateCashierCashAction(tellerId, cashierId, payload)
        : await settleCashierCashAction(tellerId, cashierId, payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(isAllocate ? 'Cash allocated.' : 'Cash settled.');
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={descriptionText}
      formId={formId}
      submitLabel={isAllocate ? 'Allocate' : 'Settle'}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
      error={submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null}
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-4">

        <MoneyField
          label="Amount"
          value={amount}
          onChange={setAmount}
          currencyCode={currencyCode}
          error={fieldErrors.txnAmount}
          disabled={pending}
        />

        <TransactionDateField
          label="Transaction date"
          value={txnDate}
          onChange={setTxnDate}
          error={fieldErrors.txnDate}
          disabled={pending}
        />

        <TextField
          label="Description"
          value={description}
          onChange={setDescription}
          error={fieldErrors.description}
          disabled={pending}
          optional
        />
      </form>
    </FormSheet>
  );
}

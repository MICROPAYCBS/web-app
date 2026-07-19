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
import { executeSavingsAccountExtendedTransactionCommandAction } from '@/actions/savings-account-command';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';

export function SavingsAccountPostInterestAsOnSheet({
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
  const initialTransactionDate = useInitialTransactionDate();
  const [transactionDate, setTransactionDate] = useState(initialTransactionDate);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setTransactionDate(initialTransactionDate);
    setError(null);
    setFieldErrors({});
  }, [open, initialTransactionDate]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountExtendedTransactionCommandAction(
        clientId,
        String(accountId),
        'postInterestAsOn',
        { transactionDate }
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
      title="Post interest as on"
      description="Post interest accrued up to the selected date."
      formId={formId}
      submitLabel="Post interest"
      submitLoading={pending}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <TransactionDateField
          id={`${formId}-date`}
          label="Interest post date"
          value={transactionDate}
          onChange={setTransactionDate}
          error={fieldErrors.transactionDate}
          required
          disabled={pending}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

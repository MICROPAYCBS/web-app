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
  executeSavingsAccountExtendedTransactionCommandAction,
  loadSavingsAccountHoldReasonsAction
} from '@/actions/savings-account-command';
import { CodeValueSelectField } from '@/components/composites/code-value-select-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME } from '@/lib/fineract/savings-account-command-meta';

export function SavingsAccountHoldAmountSheet({
  clientId,
  accountId,
  currencyCode,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [reasons, setReasons] = useState<{ id: number; name: string }[]>([]);
  const [reasonCodeName, setReasonCodeName] = useState(SAVINGS_ACCOUNT_HOLD_REASON_CODE_NAME);
  const [reasonForBlock, setReasonForBlock] = useState('');
  const initialTransactionDate = useInitialTransactionDate();
  const [transactionDate, setTransactionDate] = useState(initialTransactionDate);
  const [amount, setAmount] = useState('');
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
    setReasonForBlock('');
    setTransactionDate(initialTransactionDate);
    setAmount('');
    void loadSavingsAccountHoldReasonsAction().then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setReasons([]);
        return;
      }
      setReasons(result.reasons);
      setReasonCodeName(result.codeName);
    });
    return () => {
      cancelled = true;
    };
  }, [open, initialTransactionDate]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountExtendedTransactionCommandAction(
        clientId,
        String(accountId),
        'holdAmount',
        {
          reasonForBlock,
          transactionDate,
          transactionAmount: amount
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
      title="Hold amount"
      description="Place a hold on part of the available balance."
      formId={formId}
      submitLabel="Hold amount"
      submitLoading={pending}
      submitDisabled={loading}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading hold reasons…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <CodeValueSelectField
            id={`${formId}-reason`}
            label="Reason"
            codeName={reasonCodeName}
            value={reasonForBlock}
            onValueChange={(value) => setReasonForBlock(value ?? '')}
            options={reasons.map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="Select a reason"
            error={fieldErrors.reasonForBlock}
            required
            disabled={pending}
          />
          <TransactionDateField
            id={`${formId}-date`}
            label="Transaction date"
            value={transactionDate}
            onChange={setTransactionDate}
            error={fieldErrors.transactionDate}
            required
            disabled={pending}
          />
          <MoneyField
            id={`${formId}-amount`}
            label="Amount to hold"
            value={amount}
            onChange={setAmount}
            currencyCode={currencyCode}
            error={fieldErrors.transactionAmount}
            required
            disabled={pending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      )}
    </FormSheet>
  );
}

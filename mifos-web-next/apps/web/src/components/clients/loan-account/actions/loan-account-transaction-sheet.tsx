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
  executeLoanAccountTransactionCommandAction,
  loadLoanAccountTransactionSheetDataAction
} from '@/actions/loan-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import type { LoanAccountTransactionCommand } from '@/lib/fineract/loan-account-command-meta';
import type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';

const COPY: Record<
  LoanAccountTransactionCommand,
  { title: string; description: string; submitLabel: string; destructive?: boolean }
> = {
  repayment: {
    title: 'Make repayment',
    description: 'Post a repayment against this loan.',
    submitLabel: 'Post repayment'
  },
  writeoff: {
    title: 'Write off loan',
    description: 'Write off the outstanding balance on this loan.',
    submitLabel: 'Write off',
    destructive: true
  },
  recoverypayment: {
    title: 'Recovery payment',
    description: 'Post a recovery payment on this written-off loan.',
    submitLabel: 'Post recovery payment'
  },
  foreclosure: {
    title: 'Foreclose loan',
    description: 'Foreclose this loan and settle the outstanding balance.',
    submitLabel: 'Foreclose',
    destructive: true
  },
  waiveinterest: {
    title: 'Waive interest',
    description: 'Waive interest due on this loan.',
    submitLabel: 'Waive interest'
  },
  close: {
    title: 'Close loan',
    description: 'Close this loan when all obligations are met.',
    submitLabel: 'Close loan'
  },
  'close-rescheduled': {
    title: 'Close as rescheduled',
    description: 'Close this loan after rescheduling.',
    submitLabel: 'Close as rescheduled'
  }
};

export function LoanAccountTransactionSheet({
  clientId,
  accountId,
  currencyCode,
  command,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  currencyCode: string;
  command: LoanAccountTransactionCommand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const initialTransactionDate = useInitialTransactionDate();
  const [transactionDate, setTransactionDate] = useState(initialTransactionDate);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [writeoffReasonId, setWriteoffReasonId] = useState('');
  const [note, setNote] = useState('');
  const [paymentTypes, setPaymentTypes] = useState<CashierAwarePaymentTypeOption[]>([]);
  const [writeOffReasons, setWriteOffReasons] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const copy = command ? COPY[command] : COPY.repayment;
  const showPaymentType = command === 'repayment' || command === 'recoverypayment';
  const showWriteOffReason = command === 'writeoff';
  const hideAmount = command === 'writeoff';

  useEffect(() => {
    if (!open || !command) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setTransactionDate(initialTransactionDate);
    setPaymentTypeId('');
    setWriteoffReasonId('');
    setNote('');
    void loadLoanAccountTransactionSheetDataAction(String(accountId), command).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setPaymentTypes([]);
        setWriteOffReasons([]);
        return;
      }
      setPaymentTypes(result.paymentTypeOptions);
      setWriteOffReasons(result.writeOffReasonOptions);
      if (result.amount != null && !hideAmount) {
        setTransactionAmount(String(result.amount));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, command, hideAmount, initialTransactionDate, open]);

  if (!command) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!command) {
      return;
    }
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const activeCommand = command;
      const payload: Record<string, unknown> = {
        transactionDate,
        note: note.trim() || undefined
      };
      if (!hideAmount) {
        payload.transactionAmount = transactionAmount;
      }
      if (showPaymentType && paymentTypeId) {
        payload.paymentTypeId = paymentTypeId;
      }
      if (showWriteOffReason && writeoffReasonId) {
        payload.writeoffReasonId = writeoffReasonId;
      }

      const result = await executeLoanAccountTransactionCommandAction(
        clientId,
        String(accountId),
        activeCommand,
        payload
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
      title={copy.title}
      description={copy.description}
      formId={formId}
      submitLabel={copy.submitLabel}
      submitLoading={pending || loading}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <TransactionDateField
          id={`${formId}-date`}
          label="Transaction date"
          value={transactionDate}
          onChange={setTransactionDate}
          error={fieldErrors.transactionDate}
          required
        />
        {!hideAmount ? (
          <MoneyField
            id={`${formId}-amount`}
            label="Amount"
            value={transactionAmount}
            onChange={setTransactionAmount}
            currencyCode={currencyCode}
            error={fieldErrors.transactionAmount}
            required
          />
        ) : null}
        {showPaymentType ? (
          <SelectField
            id={`${formId}-payment-type`}
            label="Payment type"
            value={paymentTypeId}
            onValueChange={(value) => setPaymentTypeId(value ?? '')}
            options={paymentTypes.map((option) => ({
              value: String(option.id),
              label: option.name
            }))}
            placeholder="Select payment type"
            error={fieldErrors.paymentTypeId}
            required
          />
        ) : null}
        {showWriteOffReason && writeOffReasons.length ? (
          <SelectField
            id={`${formId}-writeoff-reason`}
            label="Write-off reason"
            value={writeoffReasonId}
            onValueChange={(value) => setWriteoffReasonId(value ?? '')}
            options={writeOffReasons.map((option) => ({
              value: String(option.id),
              label: option.name
            }))}
            placeholder="Select reason (optional)"
            error={fieldErrors.writeoffReasonId}
          />
        ) : null}
        <TextField
          id={`${formId}-note`}
          label="Note (optional)"
          value={note}
          onChange={setNote}
          error={fieldErrors.note}
          multiline
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

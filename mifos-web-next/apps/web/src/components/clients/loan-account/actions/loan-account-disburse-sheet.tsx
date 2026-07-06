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
  executeLoanAccountDisburseAction,
  loadLoanAccountDisburseSheetDataAction
} from '@/actions/loan-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';

export type LoanAccountDisburseCommand = 'disburse' | 'disbursetosavings';

const COPY: Record<
  LoanAccountDisburseCommand,
  { title: string; description: string; submitLabel: string }
> = {
  disburse: {
    title: 'Disburse loan',
    description: 'Post the disbursement to this loan account.',
    submitLabel: 'Disburse'
  },
  disbursetosavings: {
    title: 'Disburse to savings',
    description: 'Disburse the approved amount to the linked savings account.',
    submitLabel: 'Disburse to savings'
  }
};

export function LoanAccountDisburseSheet({
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
  command: LoanAccountDisburseCommand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const initialTransactionDate = useInitialTransactionDate();
  const [actualDisbursementDate, setActualDisbursementDate] = useState(initialTransactionDate);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [note, setNote] = useState('');
  const [paymentTypes, setPaymentTypes] = useState<CashierAwarePaymentTypeOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const copy = command ? COPY[command] : COPY.disburse;
  const showPaymentType = command === 'disburse';

  useEffect(() => {
    if (!open || !command) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setActualDisbursementDate(initialTransactionDate);
    setPaymentTypeId('');
    setNote('');
    void loadLoanAccountDisburseSheetDataAction(
      String(accountId),
      command === 'disburse' ? 'disburse' : 'disburseToSavings'
    ).then((result) => {
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
      if (result.amount != null) {
        setTransactionAmount(String(result.amount));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, command, initialTransactionDate, open]);

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
        actualDisbursementDate,
        transactionAmount,
        note: note.trim() || undefined
      };
      if (showPaymentType && paymentTypeId) {
        payload.paymentTypeId = paymentTypeId;
      }

      const result = await executeLoanAccountDisburseAction(
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
          label="Disbursement date"
          value={actualDisbursementDate}
          onChange={setActualDisbursementDate}
          error={fieldErrors.actualDisbursementDate}
          required
        />
        <MoneyField
          id={`${formId}-amount`}
          label="Amount"
          value={transactionAmount}
          onChange={setTransactionAmount}
          currencyCode={currencyCode}
          error={fieldErrors.transactionAmount}
          required
        />
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

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
import { useEffect, useId, useState, useTransition, type FormEvent } from 'react';
import {
  executeLoanAccountTransactionCommandAction,
  loadLoanPrepayQuoteAction
} from '@/actions/loan-account-command';
import { PeriodicAccrualPayoffQuote } from '@/components/clients/loan-account/periodic-accrual-payoff-quote';
import { MoneyValue } from '@/components/composites/detail/money-value';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';
import { loanRepaymentOverpaymentError } from '@/lib/fineract/loan-account-repayment-transfer';
import type { PeriodicAccrualPayoff } from '@/lib/fineract/periodic-accrual-payoff';

export function LoanAccountPrepaySheet({
  clientId,
  accountId,
  currencyCode,
  outstanding,
  canPost,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  currencyCode: string;
  /** Current outstanding balance. A payoff above this would leave the loan overpaid. */
  outstanding?: number;
  canPost: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const initialTransactionDate = useInitialTransactionDate();
  const [transactionDate, setTransactionDate] = useState(initialTransactionDate);
  const [amount, setAmount] = useState<number | undefined>();
  const [payoff, setPayoff] = useState<PeriodicAccrualPayoff | null>(null);
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [note, setNote] = useState('');
  const [paymentTypes, setPaymentTypes] = useState<CashierAwarePaymentTypeOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setTransactionDate(initialTransactionDate);
    setPaymentTypeId('');
    setNote('');
    setError(null);
    setFieldErrors({});
  }, [initialTransactionDate, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadLoanPrepayQuoteAction(String(accountId), transactionDate).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setAmount(undefined);
        setPayoff(null);
        setPaymentTypes([]);
        setError(result.message);
        return;
      }
      setAmount(result.amount);
      setPayoff(result.periodicAccrualPayoff);
      setPaymentTypes(result.paymentTypeOptions);
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, open, transactionDate]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canPost || amount == null) {
      return;
    }
    const overpayment = loanRepaymentOverpaymentError(amount, outstanding);
    if (overpayment) {
      setError(overpayment);
      setFieldErrors({ transactionAmount: overpayment });
      return;
    }
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await executeLoanAccountTransactionCommandAction(
        clientId,
        String(accountId),
        'repayment',
        {
          transactionDate,
          transactionAmount: amount,
          paymentTypeId: paymentTypeId || undefined,
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

  const overpayment = amount != null ? loanRepaymentOverpaymentError(amount, outstanding) : null;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Prepay quote"
      description={
        canPost
          ? 'Quote the payoff for this date. The amount below is what will be posted.'
          : 'Quote the payoff for this date. Direct repayments are turned off, so this amount cannot be posted from here.'
      }
      formId={formId}
      submitLabel="Post prepay"
      submitDisabled={!canPost || loading || amount == null || overpayment != null}
      submitLoading={pending || loading}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <TransactionDateField
          id={`${formId}-date`}
          label="Payoff date"
          value={transactionDate}
          onChange={setTransactionDate}
          error={fieldErrors.transactionDate}
          required
        />
        <div className="text-sm">
          <p className="text-muted-foreground">Amount that will be posted</p>
          <p className="font-medium">
            <MoneyValue amount={amount} currencyCode={currencyCode} />
          </p>
          {overpayment ? <p className="mt-1 text-destructive">{overpayment}</p> : null}
        </div>
        {payoff ? <PeriodicAccrualPayoffQuote payoff={payoff} currencyCode={currencyCode} /> : null}
        {canPost ? (
          <>
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
            <TextField
              id={`${formId}-note`}
              label="Note (optional)"
              value={note}
              onChange={setNote}
              error={fieldErrors.note}
              multiline
            />
          </>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

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
  executeLoanAccountApproveAction,
  loadLoanAccountApproveSheetDataAction
} from '@/actions/loan-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { TextField } from '@/components/composites/text-field';
import { DateField } from '@/components/composites/date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { LOAN_APPROVE_COMMAND_TOAST } from '@/lib/fineract/loan-account-command-toasts';
import { parseFineractDateString, toFineractDate } from '@/lib/fineract/dates';

export function LoanAccountApproveSheet({
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
  const initialTransactionDate = useInitialTransactionDate();
  const [approvedOnDate, setApprovedOnDate] = useState(initialTransactionDate);
  const [expectedDisbursementDate, setExpectedDisbursementDate] = useState('');
  const [approvedLoanAmount, setApprovedLoanAmount] = useState('');
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
    setApprovedOnDate(initialTransactionDate);
    setExpectedDisbursementDate('');
    setNote('');
    void loadLoanAccountApproveSheetDataAction(String(accountId)).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.approvalAmount != null) {
        setApprovedLoanAmount(String(result.approvalAmount));
      }
      if (result.expectedDisbursementDate) {
        setExpectedDisbursementDate(result.expectedDisbursementDate);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, initialTransactionDate, open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const trimmedExpected = expectedDisbursementDate.trim();
      const parsedExpected = trimmedExpected ? parseFineractDateString(trimmedExpected) : null;
      const normalizedExpected = parsedExpected ? toFineractDate(parsedExpected) : undefined;

      const result = await executeLoanAccountApproveAction(clientId, String(accountId), {
        approvedOnDate,
        ...(normalizedExpected ? { expectedDisbursementDate: normalizedExpected } : {}),
        approvedLoanAmount,
        note: note.trim() || undefined
      });

      if (!toastCommandOutcome(result, LOAN_APPROVE_COMMAND_TOAST)) {
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
      title="Approve loan"
      description="Set approval date and approved amount."
      formId={formId}
      submitLabel="Approve"
      submitLoading={pending || loading}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <TransactionDateField
          id={`${formId}-approved-on`}
          label="Approved on"
          value={approvedOnDate}
          onChange={setApprovedOnDate}
          error={fieldErrors.approvedOnDate}
          required
        />
        <DateField
          id={`${formId}-expected-disbursement`}
          label="Expected disbursement"
          optional
          value={expectedDisbursementDate}
          onChange={(value) => setExpectedDisbursementDate(value ?? '')}
          error={fieldErrors.expectedDisbursementDate}
          allowFuture
        />
        <MoneyField
          id={`${formId}-amount`}
          label="Approved amount"
          value={approvedLoanAmount}
          onChange={setApprovedLoanAmount}
          currencyCode={currencyCode}
          error={fieldErrors.approvedLoanAmount}
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

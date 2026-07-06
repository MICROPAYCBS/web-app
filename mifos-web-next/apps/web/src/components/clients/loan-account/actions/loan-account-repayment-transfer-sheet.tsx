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
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import {
  createLoanRepaymentTransferAction,
  loadLoanAccountRepaymentTransferSheetAction
} from '@/actions/account-transfer';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import {
  loanAccountCanRepayFromSavings,
  loanAccountLinkedSavingsLabel,
  loanAccountRepaymentTransferDefaults
} from '@/lib/fineract/loan-account-repayment-transfer';
import {
  loanAccountCurrencyCode,
  loanAccountLinkedAccountId,
  loanAccountProductName,
  formatLoanAccountMoney
} from '@/lib/fineract/loan-account-display';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import { LOAN_PORTFOLIO_ACCOUNT_TYPE } from '@/lib/fineract/portfolio-account-types';

export function LoanAccountRepaymentTransferSheet({
  clientId,
  account,
  open,
  onOpenChange
}: {
  clientId: string;
  account: FineractLoanAccountDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const currencyCode = loanAccountCurrencyCode(account);
  const linkedSavingsAccountId = loanAccountLinkedAccountId(account);
  const linkedSavingsLabel = loanAccountLinkedSavingsLabel(account);

  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const initialTransactionDate = useInitialTransactionDate();
  const [transferDate, setTransferDate] = useState(initialTransactionDate);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [toOfficeId, setToOfficeId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || linkedSavingsAccountId == null) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setTransferDate(initialTransactionDate);

    void loadLoanAccountRepaymentTransferSheetAction(
      clientId,
      account.id,
      linkedSavingsAccountId
    ).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setAvailableBalance(0);
        return;
      }

      const balance = result.availableBalance;
      const officeId =
        result.template.fromClient?.officeId ??
        result.template.fromOffice?.id ??
        result.template.toOfficeOptions?.[0]?.id;
      setAvailableBalance(balance);
      setToOfficeId(officeId != null ? String(officeId) : '');
      const defaults = loanAccountRepaymentTransferDefaults(account, balance);
      setTransferAmount(defaults.transferAmount);
      setTransferDescription(defaults.transferDescription);
    });

    return () => {
      cancelled = true;
    };
  }, [account, clientId, initialTransactionDate, linkedSavingsAccountId, open]);

  if (linkedSavingsAccountId == null || !loanAccountCanRepayFromSavings(account)) {
    return null;
  }

  const fromSavingsAccountId = linkedSavingsAccountId;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createLoanRepaymentTransferAction(
        clientId,
        account.id,
        fromSavingsAccountId,
        {
          toOfficeId,
          toClientId: clientId,
          toAccountType: LOAN_PORTFOLIO_ACCOUNT_TYPE,
          toAccountId: account.id,
          transferDate,
          transferAmount,
          transferDescription
        }
      );

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      toastCommandOutcome(result, {
        completed: 'Repayment transfer posted.',
        pending: 'Repayment transfer sent for approval.'
      });
      onOpenChange(false);
      router.refresh();
    });
  }

  const outstanding = account.summary?.totalOutstanding;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Repay from savings"
      description="Transfer funds from the linked savings account to post a loan repayment."
      formId={formId}
      submitLabel="Post repayment"
      submitLoading={pending || loading}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <dl className="grid gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">From savings</dt>
            <dd className="font-medium">{linkedSavingsLabel ?? `#${linkedSavingsAccountId}`}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Available balance</dt>
            <dd className="font-medium tabular-nums">
              {formatLoanAccountMoney(account, availableBalance)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">To loan</dt>
            <dd className="font-medium">{loanAccountProductName(account)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Outstanding balance</dt>
            <dd className="font-medium tabular-nums">
              {outstanding != null ? formatLoanAccountMoney(account, outstanding) : '—'}
            </dd>
          </div>
        </dl>

        <TransactionDateField
          id={`${formId}-date`}
          label="Transfer date"
          value={transferDate}
          onChange={setTransferDate}
          error={fieldErrors.transferDate}
          required
        />
        <MoneyField
          id={`${formId}-amount`}
          label="Amount"
          value={transferAmount}
          onChange={setTransferAmount}
          currencyCode={currencyCode}
          error={fieldErrors.transferAmount}
          required
          hint={
            availableBalance > 0
              ? `Up to ${formatLoanAccountMoney(account, availableBalance)} available in savings.`
              : undefined
          }
        />
        <TextField
          id={`${formId}-description`}
          label="Description"
          required
          value={transferDescription}
          onChange={setTransferDescription}
          error={fieldErrors.transferDescription}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

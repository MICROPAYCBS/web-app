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
  createLoanRepaymentTransferAction,
  loadLoanAccountRepaymentTransferSheetAction
} from '@/actions/account-transfer';
import {
  executeLoanAccountTransactionCommandAction,
  loadLoanAccountTransactionSheetDataAction
} from '@/actions/loan-account-command';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { accountTransferAvailableBalance } from '@/lib/fineract/account-transfer-balance';
import type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';
import {
  loanAccountCurrencyCode,
  loanAccountLinkedAccountId,
  loanAccountProductName,
  formatLoanAccountMoney
} from '@/lib/fineract/loan-account-display';
import {
  loanAccountLinkedSavingsLabel,
  loanAccountRepaymentTransferDefaults
} from '@/lib/fineract/loan-account-repayment-transfer';
import type { LoanAccountTransactionCommand } from '@/lib/fineract/loan-account-command-meta';
import type { FineractLoanAccountDetail } from '@/lib/fineract/loan-account-types';
import {
  SAVINGS_ONLY_REPAYMENT_MESSAGE,
  type LoanInboundPaymentKind,
  type LoanInboundPaymentMethod
} from '@/lib/fineract/loan-repayment-policy-paths';
import { resolveLoanInboundPaymentMethods } from '@/lib/fineract/loan-repayment-ui';
import { LOAN_PORTFOLIO_ACCOUNT_TYPE } from '@/lib/fineract/portfolio-account-types';

const COPY: Record<
  LoanInboundPaymentKind,
  {
    title: string;
    description: string;
    directSubmitLabel: string;
    savingsSubmitLabel: string;
  }
> = {
  repayment: {
    title: 'Make loan repayment',
    description: 'Post a repayment against this loan.',
    directSubmitLabel: 'Post repayment',
    savingsSubmitLabel: 'Post repayment'
  },
  recoverypayment: {
    title: 'Recovery payment',
    description: 'Post a recovery payment on this written-off loan.',
    directSubmitLabel: 'Post recovery payment',
    savingsSubmitLabel: 'Post recovery payment'
  }
};

export function LoanAccountInboundPaymentSheet({
  clientId,
  account,
  kind,
  open,
  onOpenChange,
  allowDirectLoanRepayments,
  canDirect,
  canTransfer
}: {
  clientId: string;
  account: FineractLoanAccountDetail;
  kind: LoanInboundPaymentKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowDirectLoanRepayments: boolean;
  canDirect: boolean;
  canTransfer: boolean;
}) {
  const formId = useId();
  const router = useRouter();
  const currencyCode = loanAccountCurrencyCode(account);
  const linkedSavingsAccountId = loanAccountLinkedAccountId(account);
  const linkedSavingsLabel = loanAccountLinkedSavingsLabel(account);
  const command = kind as LoanAccountTransactionCommand | null;

  const { methods, defaultMethod } = resolveLoanInboundPaymentMethods({
    allowDirectLoanRepayments,
    canDirect,
    canTransfer
  });
  const showMethodTabs = methods.length > 1;
  const savingsOnlyRequired =
    methods.length === 0 ||
    (!allowDirectLoanRepayments && linkedSavingsAccountId == null);

  const [paymentMethod, setPaymentMethod] = useState<LoanInboundPaymentMethod>('direct');
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const initialTransactionDate = useInitialTransactionDate();

  const [transactionDate, setTransactionDate] = useState(initialTransactionDate);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [note, setNote] = useState('');
  const [paymentTypes, setPaymentTypes] = useState<CashierAwarePaymentTypeOption[]>([]);

  const [transferDate, setTransferDate] = useState(initialTransactionDate);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [toOfficeId, setToOfficeId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !kind) {
      return;
    }
    setPaymentMethod(defaultMethod ?? 'savings');
    setError(null);
    setFieldErrors({});
  }, [defaultMethod, kind, open]);

  useEffect(() => {
    if (!open || !kind || paymentMethod !== 'direct' || !methods.includes('direct') || !command) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setTransactionDate(initialTransactionDate);
    setPaymentTypeId('');
    setNote('');

    void loadLoanAccountTransactionSheetDataAction(String(account.id), command).then((result) => {
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
  }, [account.id, command, initialTransactionDate, kind, methods, open, paymentMethod]);

  useEffect(() => {
    if (
      !open ||
      !kind ||
      paymentMethod !== 'savings' ||
      !methods.includes('savings') ||
      linkedSavingsAccountId == null
    ) {
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

      const balance = accountTransferAvailableBalance(result.template);
      const officeId =
        result.template.fromClient?.officeId ??
        result.template.fromOffice?.id ??
        result.template.toOfficeOptions?.[0]?.id;
      setAvailableBalance(balance);
      setToOfficeId(officeId != null ? String(officeId) : '');
      const defaults = loanAccountRepaymentTransferDefaults(account, balance, kind);
      setTransferAmount(defaults.transferAmount);
      setTransferDescription(defaults.transferDescription);
    });

    return () => {
      cancelled = true;
    };
  }, [
    account,
    clientId,
    initialTransactionDate,
    kind,
    linkedSavingsAccountId,
    methods,
    open,
    paymentMethod
  ]);

  if (!kind) {
    return null;
  }

  const copy = COPY[kind];
  const outstanding = account.summary?.totalOutstanding;
  const activeMethod = methods.includes(paymentMethod)
    ? paymentMethod
    : (defaultMethod ?? methods[0] ?? 'savings');
  const submitLabel =
    activeMethod === 'direct' ? copy.directSubmitLabel : copy.savingsSubmitLabel;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!kind) {
      return;
    }
    setError(null);
    setFieldErrors({});

    if (activeMethod === 'direct') {
      if (!command) {
        return;
      }
      startTransition(async () => {
        const result = await executeLoanAccountTransactionCommandAction(
          clientId,
          String(account.id),
          command,
          {
            transactionDate,
            transactionAmount,
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
      return;
    }

    if (linkedSavingsAccountId == null) {
      setError(SAVINGS_ONLY_REPAYMENT_MESSAGE);
      return;
    }

    startTransition(async () => {
      const result = await createLoanRepaymentTransferAction(
        clientId,
        account.id,
        linkedSavingsAccountId,
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
        completed:
          kind === 'recoverypayment'
            ? 'Recovery payment transfer posted.'
            : 'Repayment transfer posted.',
        pending:
          kind === 'recoverypayment'
            ? 'Recovery payment transfer sent for approval.'
            : 'Repayment transfer sent for approval.'
      });
      onOpenChange(false);
      router.refresh();
    });
  }

  const directForm = (
    <div className="space-y-4">
      <TransactionDateField
        id={`${formId}-date`}
        label="Transaction date"
        value={transactionDate}
        onChange={setTransactionDate}
        error={fieldErrors.transactionDate}
        required
        disabled={pending || loading}
      />
      <MoneyField
        id={`${formId}-amount`}
        label="Amount"
        value={transactionAmount}
        onChange={setTransactionAmount}
        currencyCode={currencyCode}
        error={fieldErrors.transactionAmount}
        required
        disabled={pending || loading}
      />
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
        disabled={pending || loading}
      />
      <TextField
        id={`${formId}-note`}
        label="Note (optional)"
        value={note}
        onChange={setNote}
        error={fieldErrors.note}
        multiline
        disabled={pending || loading}
      />
    </div>
  );

  const savingsForm = (
    <div className="space-y-4">
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
        id={`${formId}-transfer-date`}
        label="Transfer date"
        value={transferDate}
        onChange={setTransferDate}
        error={fieldErrors.transferDate}
        required
        disabled={pending || loading}
      />
      <MoneyField
        id={`${formId}-transfer-amount`}
        label="Amount"
        value={transferAmount}
        onChange={setTransferAmount}
        currencyCode={currencyCode}
        error={fieldErrors.transferAmount}
        required
        disabled={pending || loading}
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
        disabled={pending || loading}
      />
    </div>
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      formId={formId}
      submitLabel={submitLabel}
      submitLoading={pending || loading}
      submitDisabled={savingsOnlyRequired}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {savingsOnlyRequired ? (
          <p className="rounded-md border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
            {SAVINGS_ONLY_REPAYMENT_MESSAGE}
          </p>
        ) : showMethodTabs ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Payment method</p>
              <Tabs
                value={activeMethod}
                onValueChange={(value) => setPaymentMethod(value as LoanInboundPaymentMethod)}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="direct" disabled={pending || loading}>
                    Direct
                  </TabsTrigger>
                  <TabsTrigger value="savings" disabled={pending || loading}>
                    From savings account
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="direct" className="mt-4">
                  {directForm}
                </TabsContent>
                <TabsContent value="savings" className="mt-4">
                  {savingsForm}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : activeMethod === 'direct' ? (
          directForm
        ) : (
          savingsForm
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

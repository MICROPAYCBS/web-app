'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender } from '@mifos/api-client';
import { formatMoney, parseAmount } from '@mifos/domain';
import { formatActionErrorMessage, type CashTransactionEntryMode } from '@mifos/validation';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import {
  executeDepositAccountTransactionAction,
  loadDepositAccountTransactionSheetDataAction
} from '@/actions/deposit-account-command';
import {
  buildSavingsReceiptFromSubmission,
  SavingsReceiptDownloadButton,
  type SavingsReceiptData
} from '@/components/clients/savings/receipt';
import { CashierSessionRequiredAlert } from '@/components/accounts/cashier-session-required-alert';
import { DOCKED_SHEET_LAYOUT_CLASSNAME } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import {
  emptyPaymentDetailFields,
  PaymentDetailFields,
  type PaymentDetailFieldValues
} from '@/components/composites/payment-detail-fields';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import {
  buildLegalTenderLines,
  CashierLegalTenderGrid,
  emptyLegalTenderQuantities,
  legalTenderTotalAmount,
  legalTenderTotalIsValid,
  type LegalTenderQuantityMap
} from '@/components/organization/cashier-legal-tender-grid';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CashierAwarePaymentTypeOption } from '@/lib/fineract/cash-payment-type';
import type {
  CashierPolicySettings,
  LegalTenderCaptureMode
} from '@/lib/fineract/cashier-policy-paths';
import type { TermDepositAccountKind } from '@/lib/fineract/deposit-account-display';
import { legalTenderListPath } from '@/lib/fineract/legal-tender-paths';
import { cn } from '@/lib/utils';

type TransactionSuccessState = {
  receipt: SavingsReceiptData;
  amountLabel: string;
};

export function DepositAccountTransactionSheet({
  kind,
  clientId,
  accountId,
  accountNo,
  clientName,
  orgName,
  command,
  currencyCode,
  open,
  onOpenChange
}: {
  kind: TermDepositAccountKind;
  clientId: string;
  accountId: number;
  accountNo: string;
  clientName?: string;
  orgName?: string;
  command: 'deposit' | 'withdrawal' | null;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [paymentTypes, setPaymentTypes] = useState<CashierAwarePaymentTypeOption[]>([]);
  const [cashierPolicy, setCashierPolicy] = useState<CashierPolicySettings>({
    preventCashierOverdraw: true,
    requireCashierForCashTransactions: true,
    captureLegalTenderForCashTransactions: 'OPTIONAL'
  });
  const [activeCashierSession, setActiveCashierSession] = useState(false);
  const [cashierSessionLink, setCashierSessionLink] = useState<{
    tellerId: number;
    cashierId: number;
    canOpenCashierDetail: boolean;
  } | null>(null);
  const [legalTenders, setLegalTenders] = useState<CurrencyLegalTender[]>([]);
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [entryMode, setEntryMode] = useState<CashTransactionEntryMode>('amount');
  const [quantities, setQuantities] = useState<LegalTenderQuantityMap>({});
  const initialTransactionDate = useInitialTransactionDate();
  const [transactionDate, setTransactionDate] = useState(initialTransactionDate);
  const [amount, setAmount] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [note, setNote] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailFieldValues>(
    emptyPaymentDetailFields()
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successState, setSuccessState] = useState<TransactionSuccessState | null>(null);

  const isDeposit = command === 'deposit';
  const title = isDeposit ? 'Deposit' : 'Withdrawal';
  const description = isDeposit
    ? 'Post a deposit to this recurring deposit account.'
    : 'Post a withdrawal from this recurring deposit account.';

  useEffect(() => {
    if (!open || !command) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccessState(null);
    setActiveTab('basic');
    setTransactionDate(initialTransactionDate);
    setAmount('');
    setPaymentTypeId('');
    setNote('');
    setPaymentDetails(emptyPaymentDetailFields());
    setEntryMode('amount');
    setQuantities({});
    setLegalTenders([]);
    setDecimalPlaces(2);
    setCashierPolicy({
      preventCashierOverdraw: true,
      requireCashierForCashTransactions: true,
      captureLegalTenderForCashTransactions: 'OPTIONAL'
    });
    setActiveCashierSession(false);
    setCashierSessionLink(null);
    void loadDepositAccountTransactionSheetDataAction(
      kind,
      String(accountId),
      command,
      currencyCode
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
      setCashierPolicy(result.cashierPolicy);
      setActiveCashierSession(result.activeCashierSession);
      setCashierSessionLink(result.cashierSessionLink);
      setLegalTenders(result.legalTenders);
      setDecimalPlaces(result.decimalPlaces);
      setQuantities(emptyLegalTenderQuantities(result.legalTenders));
      const defaultEntryMode: CashTransactionEntryMode =
        result.cashierPolicy.captureLegalTenderForCashTransactions === 'REQUIRED'
          ? 'denominations'
          : 'amount';
      setEntryMode(defaultEntryMode);
      const cash = result.paymentTypeOptions.find((row) => row.isCashPayment);
      const defaultId = cash?.id ?? result.paymentTypeOptions[0]?.id;
      if (defaultId) {
        setPaymentTypeId(String(defaultId));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, command, kind, accountId, currencyCode, initialTransactionDate]);

  const selectedPaymentType = useMemo(
    () => paymentTypes.find((row) => String(row.id) === paymentTypeId),
    [paymentTypeId, paymentTypes]
  );
  const isCashPayment = selectedPaymentType?.isCashPayment === true;
  const captureMode: LegalTenderCaptureMode =
    cashierPolicy.captureLegalTenderForCashTransactions;
  const showDenominationFeature = isCashPayment && captureMode !== 'OFF';
  const useDenominationEntry =
    showDenominationFeature &&
    (captureMode === 'REQUIRED' || entryMode === 'denominations');
  const showEntryModeToggle = showDenominationFeature && captureMode === 'OPTIONAL';

  useEffect(() => {
    if (!showDenominationFeature && entryMode === 'denominations') {
      setEntryMode('amount');
    }
  }, [showDenominationFeature, entryMode]);

  useEffect(() => {
    if (!useDenominationEntry || legalTenders.length === 0) {
      return;
    }
    const total = legalTenderTotalAmount(legalTenders, quantities, decimalPlaces);
    setAmount(total > 0 ? String(total) : '');
  }, [useDenominationEntry, legalTenders, quantities, decimalPlaces]);

  const requiresActiveCashier =
    cashierPolicy.requireCashierForCashTransactions && isCashPayment;
  const blockedByCashierSession = requiresActiveCashier && !activeCashierSession;
  const denominationSubmitBlocked =
    useDenominationEntry &&
    (legalTenders.length === 0 ||
      !legalTenderTotalIsValid(legalTenders, quantities, decimalPlaces));

  if (!command) {
    return null;
  }

  function handleClose() {
    onOpenChange(false);
    setSuccessState(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!command) {
      return;
    }
    const txnCommand = command;
    setError(null);
    setFieldErrors({});

    const legalTenderLines = useDenominationEntry
      ? buildLegalTenderLines(legalTenders, quantities)
      : undefined;

    startTransition(async () => {
      const result = await executeDepositAccountTransactionAction(
        kind,
        clientId,
        String(accountId),
        txnCommand,
        {
          transactionDate,
          transactionAmount: amount,
          paymentTypeId,
          entryMode: showDenominationFeature ? entryMode : undefined,
          legalTenderLines,
          note: note.trim() || undefined,
          accountNumber: paymentDetails.accountNumber.trim() || undefined,
          checkNumber: paymentDetails.checkNumber.trim() || undefined,
          routingCode: paymentDetails.routingCode.trim() || undefined,
          receiptNumber: paymentDetails.receiptNumber.trim() || undefined,
          bankNumber: paymentDetails.bankNumber.trim() || undefined
        }
      );

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      router.refresh();

      const paymentTypeName = paymentTypes.find((row) => String(row.id) === paymentTypeId)?.name;
      const parsedAmount = parseAmount(amount);
      const amountLabel =
        (parsedAmount ? formatMoney(parsedAmount, currencyCode) : null) ??
        `${currencyCode} ${amount}`;

      if (result.resourceId != null) {
        const receipt = buildSavingsReceiptFromSubmission({
          transactionId: result.resourceId,
          transactionDate,
          transactionAmount: amount,
          transactionTypeLabel: isDeposit ? 'Deposit' : 'Withdrawal',
          paymentTypeName,
          note: note.trim() || undefined,
          paymentDetails,
          account: { accountNo, clientName },
          currencyCode,
          orgName
        });
        setSuccessState({ receipt, amountLabel });
        return;
      }

      handleClose();
    });
  }

  const disabled = pending || loading;

  const basicFields = (
    <div className="space-y-4">
      <TransactionDateField
        id={`${formId}-date`}
        label="Transaction date"
        value={transactionDate}
        onChange={setTransactionDate}
        error={fieldErrors.transactionDate}
        required
        disabled={disabled}
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
        disabled={disabled}
      />
      {showEntryModeToggle ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Entry mode</p>
          <Tabs
            value={entryMode}
            onValueChange={(value) => setEntryMode(value as CashTransactionEntryMode)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="amount" disabled={disabled}>
                Amount
              </TabsTrigger>
              <TabsTrigger value="denominations" disabled={disabled}>
                Denominations
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}
      {useDenominationEntry ? (
        <CashierLegalTenderGrid
          currencyCode={currencyCode}
          decimalPlaces={decimalPlaces}
          tenders={legalTenders}
          quantities={quantities}
          onQuantitiesChange={setQuantities}
          disabled={disabled}
          emptyMessage={
            <>
              No denominations are configured for {currencyCode}. Set them up under{' '}
              <Link
                href={legalTenderListPath(currencyCode)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Organization → Legal tenders
              </Link>{' '}
              before posting cash {isDeposit ? 'deposits' : 'withdrawals'} by denomination.
            </>
          }
        />
      ) : null}
      <MoneyField
        id={`${formId}-amount`}
        label="Amount"
        value={amount}
        onChange={setAmount}
        currencyCode={currencyCode}
        error={fieldErrors.transactionAmount}
        required
        disabled={disabled || useDenominationEntry}
      />
      <TextField
        id={`${formId}-note`}
        label="Note"
        value={note}
        onChange={setNote}
        error={fieldErrors.note}
        multiline
        optional
        disabled={disabled}
      />
      {fieldErrors.legalTenderLines ? (
        <p className="text-sm text-destructive">{fieldErrors.legalTenderLines}</p>
      ) : null}
      {blockedByCashierSession ? (
        <CashierSessionRequiredAlert
          tellerId={cashierSessionLink?.tellerId}
          cashierId={cashierSessionLink?.cashierId}
          canOpenCashierDetail={cashierSessionLink?.canOpenCashierDetail}
        />
      ) : null}
    </div>
  );

  const advancedFields = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Optional payment reference details for cheque, bank transfer, or receipt tracking.
      </p>
      <PaymentDetailFields
        idPrefix={formId}
        values={paymentDetails}
        onChange={(patch) => setPaymentDetails((current) => ({ ...current, ...patch }))}
        fieldErrors={fieldErrors}
        disabled={disabled}
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : handleClose())}>
      <SheetContent
        side="right"
        showCloseButton
        className={cn(
          DOCKED_SHEET_LAYOUT_CLASSNAME,
          'data-[side=right]:w-full data-[side=right]:sm:max-w-3xl'
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border">
          <SheetTitle>{successState ? `${title} successful` : title}</SheetTitle>
          <SheetDescription>
            {successState
              ? `Transaction of ${successState.amountLabel} has been processed.`
              : description}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {successState ? (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-10 text-primary" aria-hidden />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                You can print a receipt now or close this panel and print it later from the
                transactions list.
              </p>
              <SavingsReceiptDownloadButton
                receipt={successState.receipt}
                className="w-full"
                label="Print receipt"
              />
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading payment types…</p>
          ) : (
            <form id={formId} onSubmit={handleSubmit} className="space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'basic' | 'advanced')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Payment details</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="mt-4">
                  {basicFields}
                </TabsContent>
                <TabsContent value="advanced" className="mt-4">
                  {advancedFields}
                </TabsContent>
              </Tabs>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </form>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border bg-background">
          {successState ? (
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
                Cancel
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={
                  disabled || pending || blockedByCashierSession || denominationSubmitBlocked
                }
              >
                {pending ? 'Saving…' : title}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

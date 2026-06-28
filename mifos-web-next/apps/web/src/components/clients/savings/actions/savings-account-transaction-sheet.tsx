'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { formatMoney, parseAmount } from '@mifos/domain';
import { formatActionErrorMessage } from '@mifos/validation';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import {
  executeSavingsAccountTransactionCommandAction,
  loadSavingsAccountTransactionSheetDataAction
} from '@/actions/savings-account-command';
import {
  buildSavingsReceiptFromSubmission,
  SavingsReceiptDownloadButton,
  type SavingsReceiptData
} from '@/components/clients/savings/receipt';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { DOCKED_SHEET_LAYOUT_CLASSNAME } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import {
  emptyPaymentDetailFields,
  PaymentDetailFields,
  type PaymentDetailFieldValues
} from '@/components/composites/payment-detail-fields';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
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
import { cn } from '@/lib/utils';

type DepositWithdrawCommand = 'deposit' | 'withdrawal';

type TransactionSuccessState = {
  receipt: SavingsReceiptData;
  amountLabel: string;
};

export function SavingsAccountTransactionSheet({
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
  clientId: string;
  accountId: number;
  accountNo: string;
  clientName?: string;
  orgName?: string;
  command: DepositWithdrawCommand | null;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [paymentTypes, setPaymentTypes] = useState<{ id: number; name: string }[]>([]);
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
  const title = isDeposit ? 'Deposit' : 'Withdraw';
  const description = isDeposit
    ? 'Post a deposit to this savings account.'
    : 'Withdraw funds from this savings account.';

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
    void loadSavingsAccountTransactionSheetDataAction(String(accountId), command).then((result) => {
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
      const cash = result.paymentTypeOptions.find((row) =>
        row.name.toLowerCase().includes('cash')
      );
      const defaultId = cash?.id ?? result.paymentTypeOptions[0]?.id;
      if (defaultId) {
        setPaymentTypeId(String(defaultId));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, command, accountId, initialTransactionDate]);

  if (!command) {
    return null;
  }

  function handleClose() {
    onOpenChange(false);
    setSuccessState(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountTransactionCommandAction(
        clientId,
        String(accountId),
        command as DepositWithdrawCommand,
        {
          transactionDate,
          transactionAmount: amount,
          paymentTypeId,
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
      <MoneyField
        id={`${formId}-amount`}
        label="Amount"
        value={amount}
        onChange={setAmount}
        currencyCode={currencyCode}
        error={fieldErrors.transactionAmount}
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
          'data-[side=right]:w-full data-[side=right]:sm:max-w-lg'
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
              <Button type="submit" form={formId} disabled={disabled || pending}>
                {pending ? 'Saving…' : title}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

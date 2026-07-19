'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSavingsAccountTransaction } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import {
  loadSavingsTransactionEditSheetDataAction,
  modifySavingsTransactionAction
} from '@/actions/savings-transaction-command';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import {
  emptyPaymentDetailFields,
  PaymentDetailFields
} from '@/components/composites/payment-detail-fields';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SavingsTransactionEditSheet({
  clientId,
  accountId,
  transaction,
  currencyCode,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: string | number;
  transaction: FineractSavingsAccountTransaction;
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
  const [transactionDate, setTransactionDate] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [note, setNote] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(emptyPaymentDetailFields);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isDeposit = transaction.transactionType?.deposit === true;
  const title = 'Edit transaction';
  const description = isDeposit
    ? 'Update this deposit on the savings account.'
    : 'Update this withdrawal from the savings account.';

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setActiveTab('basic');
    void loadSavingsTransactionEditSheetDataAction(String(accountId), transaction.id).then(
      (result) => {
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
        setTransactionDate(result.transactionDate);
        setAmount(result.transactionAmount);
        setPaymentTypeId(result.paymentTypeId);
        setNote(result.note);
        setPaymentDetails({
          accountNumber: result.paymentDetails.accountNumber,
          checkNumber: result.paymentDetails.checkNumber,
          routingCode: result.paymentDetails.routingCode,
          receiptNumber: result.paymentDetails.receiptNumber,
          bankNumber: result.paymentDetails.bankNumber
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [open, accountId, transaction.id]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await modifySavingsTransactionAction({
        clientId,
        accountId: String(accountId),
        transactionId: transaction.id,
        transactionDate,
        transactionAmount: amount,
        paymentTypeId,
        note: note.trim() || undefined,
        accountNumber: paymentDetails.accountNumber.trim() || undefined,
        checkNumber: paymentDetails.checkNumber.trim() || undefined,
        routingCode: paymentDetails.routingCode.trim() || undefined,
        receiptNumber: paymentDetails.receiptNumber.trim() || undefined,
        bankNumber: paymentDetails.bankNumber.trim() || undefined
      });

      if (!result.ok) {
        setError(formatActionErrorMessage(result.message, result.fieldErrors));
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  const disabled = pending || loading;

  const basicFields = (
    <div className="space-y-4">
      <TransactionDateField
        id={`${formId}-date`}
        label="Transaction date"
        value={transactionDate}
        onChange={(value) => setTransactionDate(value ?? '')}
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
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      formId={formId}
      submitLabel="Save changes"
      submitLoading={pending}
      submitDisabled={loading}
      className="data-[side=right]:sm:max-w-lg"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading transaction…</p>
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
    </FormSheet>
  );
}

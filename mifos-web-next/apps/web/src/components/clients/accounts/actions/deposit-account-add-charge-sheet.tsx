'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import {
  executeDepositAccountAddChargeAction,
  loadDepositAccountAddChargeSheetDataAction,
  loadDepositAccountChargeDetailAction
} from '@/actions/deposit-account-command';
import type { TermDepositAccountKind } from '@/lib/fineract/deposit-account-display';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { MoneyField } from '@/components/composites/money-field';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import {
  chargeCurrencyCodeFromLike,
  isFlatChargeCalculation
} from '@/lib/fineract/charge-display';

function chargeTimeFlags(value?: string) {
  const label = value?.toLowerCase() ?? '';
  return {
    dueDateNotRequired:
      label.includes('withdrawal fee') || label.includes('no activity'),
    annualOrMonthly: label.includes('annual') || label.includes('monthly'),
    isMonthly: label.includes('monthly')
  };
}

export function DepositAccountAddChargeSheet({
  kind,
  clientId,
  accountId,
  currencyCode,
  open,
  onOpenChange
}: {
  kind: TermDepositAccountKind;
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
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [chargeOptions, setChargeOptions] = useState<{ id: number; name: string }[]>([]);
  const [chargeId, setChargeId] = useState('');
  const [amount, setAmount] = useState('');
  const [chargeCalculationType, setChargeCalculationType] = useState('');
  const [chargeCurrencyCode, setChargeCurrencyCode] = useState<string | undefined>();
  const [chargeTimeType, setChargeTimeType] = useState('');
  const [chargeTimeLabel, setChargeTimeLabel] = useState('');
  const initialTransactionDate = useInitialTransactionDate();
  const [dueDate, setDueDate] = useState(initialTransactionDate);
  const [feeOnMonthDay, setFeeOnMonthDay] = useState('');
  const [feeInterval, setFeeInterval] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const flags = chargeTimeFlags(chargeTimeLabel);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setChargeId('');
    setAmount('');
    setChargeCalculationType('');
    setChargeCurrencyCode(undefined);
    setChargeTimeType('');
    setChargeTimeLabel('');
    setDueDate(initialTransactionDate);
    setFeeOnMonthDay('');
    setFeeInterval('');
    void loadDepositAccountAddChargeSheetDataAction(String(accountId)).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setChargeOptions([]);
        return;
      }
      setChargeOptions(result.chargeOptions);
    });
    return () => {
      cancelled = true;
    };
  }, [open, accountId, initialTransactionDate]);

  useEffect(() => {
    if (!chargeId) {
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    void loadDepositAccountChargeDetailAction(chargeId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoadingDetail(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const detail = result.detail;
      setAmount(detail.amount != null ? String(detail.amount) : '');
      setChargeCalculationType(
        detail.chargeCalculationType?.id != null ? String(detail.chargeCalculationType.id) : ''
      );
      setChargeCurrencyCode(
        chargeCurrencyCodeFromLike(
          {
            currencyCode: detail.currencyCode,
            chargeCalculationType: detail.chargeCalculationType
          },
          currencyCode
        ) || currencyCode
      );
      setChargeTimeType(detail.chargeTimeType?.id != null ? String(detail.chargeTimeType.id) : '');
      setChargeTimeLabel(detail.chargeTimeType?.value ?? '');
      setFeeInterval(detail.feeInterval != null ? String(detail.feeInterval) : '');
    });
    return () => {
      cancelled = true;
    };
  }, [chargeId, currencyCode]);

  const calculationTypeId = chargeCalculationType ? Number(chargeCalculationType) : undefined;
  const flatAmount = isFlatChargeCalculation(calculationTypeId);
  const amountCurrencyCode =
    chargeCurrencyCodeFromLike({ currencyCode: chargeCurrencyCode }, currencyCode) || currencyCode;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeDepositAccountAddChargeAction(
        kind,
        clientId,
        String(accountId),
        {
          chargeId,
          amount,
          dueDate: flags.dueDateNotRequired || flags.annualOrMonthly ? undefined : dueDate,
          feeOnMonthDay: flags.annualOrMonthly ? feeOnMonthDay.trim() || undefined : undefined,
          feeInterval: flags.isMonthly ? feeInterval || undefined : undefined
        }
      );

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.message);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  const disabled = pending || loading || loadingDetail;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add charge"
      description="Attach a fee or penalty to this account."
      formId={formId}
      submitLabel="Add charge"
      submitLoading={pending}
      submitDisabled={loading || loadingDetail || (Boolean(chargeId) && !chargeCalculationType)}
      className="data-[side=right]:sm:max-w-lg"
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading charges…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            id={`${formId}-charge`}
            label="Charge"
            value={chargeId}
            onValueChange={(value) => setChargeId(value ?? '')}
            options={chargeOptions.map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="Select charge"
            error={fieldErrors.chargeId}
            required
            disabled={disabled}
          />
          {loadingDetail ? (
            <p className="text-sm text-muted-foreground">Loading charge details…</p>
          ) : null}
          {chargeId ? (
            <>
              {flatAmount ? (
                <MoneyField
                  id={`${formId}-amount`}
                  label="Amount"
                  value={amount}
                  onChange={setAmount}
                  currencyCode={amountCurrencyCode}
                  error={fieldErrors.amount}
                  required
                  disabled={disabled}
                />
              ) : (
                <NumericField
                  id={`${formId}-amount`}
                  label="Amount (%)"
                  value={amount}
                  onChange={setAmount}
                  error={fieldErrors.amount}
                  required
                  disabled={disabled}
                  hint="Percentage of the base amount, e.g. 0.5 for 0.5%."
                  placeholder="0.5"
                  maxDecimalPlaces={6}
                />
              )}
              {!flags.dueDateNotRequired && !flags.annualOrMonthly ? (
                <TransactionDateField
                  id={`${formId}-due-date`}
                  label="Due date"
                  value={dueDate}
                  onChange={setDueDate}
                  error={fieldErrors.dueDate}
                  required
                  disabled={disabled}
                />
              ) : null}
              {flags.annualOrMonthly ? (
                <TextField
                  id={`${formId}-fee-day`}
                  label="Fee day"
                  hint="Use MM-DD format (e.g. 01-15)."
                  value={feeOnMonthDay}
                  onChange={setFeeOnMonthDay}
                  error={fieldErrors.feeOnMonthDay}
                  required
                  disabled={disabled}
                />
              ) : null}
              {flags.isMonthly ? (
                <NumericField
                  id={`${formId}-fee-interval`}
                  label="Fee interval"
                  integer
                  value={feeInterval}
                  onChange={setFeeInterval}
                  error={fieldErrors.feeInterval}
                  required
                  disabled={disabled}
                />
              ) : null}
            </>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      )}
    </FormSheet>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import {
  executeLoanAccountAddChargeAction,
  loadLoanAccountAddChargeSheetDataAction
} from '@/actions/loan-account-command';
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
import {
  chargeAmountForApplication,
  chargeExpectsDueDate
} from '@/lib/fineract/loan-application-charges';
import type { LoanAccountChargeTemplateOption } from '@/lib/fineract/loan-account-types';
import { enumOptionLabel } from '@/lib/fineract/client-detail-labels';

export function LoanAccountAddChargeSheet({
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
  const [chargeOptions, setChargeOptions] = useState<LoanAccountChargeTemplateOption[]>([]);
  const [chargeId, setChargeId] = useState('');
  const [amount, setAmount] = useState('');
  const initialTransactionDate = useInitialTransactionDate();
  const [dueDate, setDueDate] = useState(initialTransactionDate);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedCharge = useMemo(
    () => chargeOptions.find((option) => String(option.id) === chargeId),
    [chargeId, chargeOptions]
  );

  const expectsDueDate = chargeExpectsDueDate(selectedCharge);
  const calculationTypeId = selectedCharge?.chargeCalculationType?.id;
  const flatAmount = isFlatChargeCalculation(calculationTypeId);
  const amountCurrencyCode = selectedCharge
    ? chargeCurrencyCodeFromLike(selectedCharge, currencyCode) || currencyCode
    : currencyCode;

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
    setDueDate(initialTransactionDate);
    void loadLoanAccountAddChargeSheetDataAction(String(accountId)).then((result) => {
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
    if (!selectedCharge) {
      return;
    }
    setAmount(String(chargeAmountForApplication(selectedCharge)));
  }, [selectedCharge]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeLoanAccountAddChargeAction(clientId, String(accountId), {
        chargeId,
        amount,
        dueDate: expectsDueDate ? dueDate : undefined
      });

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.message);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  const disabled = pending || loading;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add charge"
      description="Attach a fee or penalty to this loan."
      formId={formId}
      submitLabel="Add charge"
      submitLoading={pending}
      submitDisabled={loading || (Boolean(chargeId) && !amount.trim())}
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
            options={chargeOptions.map((row) => ({
              value: String(row.id),
              label: row.currencyCode ? `${row.name} (${row.currencyCode})` : row.name
            }))}
            placeholder="Select charge"
            error={fieldErrors.chargeId}
            required
            disabled={disabled}
          />
          {selectedCharge ? (
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
              <TextField
                id={`${formId}-calculation`}
                label="Charge calculation"
                value={enumOptionLabel(selectedCharge.chargeCalculationType) ?? '—'}
                onChange={() => {}}
                disabled
              />
              <TextField
                id={`${formId}-time`}
                label="Charge time"
                value={enumOptionLabel(selectedCharge.chargeTimeType) ?? '—'}
                onChange={() => {}}
                disabled
              />
              {expectsDueDate ? (
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
            </>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      )}
    </FormSheet>
  );
}

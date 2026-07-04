'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CurrencyLegalTender } from '@mifos/api-client';
import { formatMoney } from '@mifos/domain';
import { formatActionErrorMessage } from '@mifos/validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  allocateCashierCashAction,
  loadCashierCashActionSheetDataAction,
  settleCashierCashAction
} from '@/actions/cashier';
import {
  buildLegalTenderLines,
  CashierLegalTenderGrid,
  emptyLegalTenderQuantities,
  legalTenderTotalAmount,
  type LegalTenderQuantityMap
} from '@/components/organization/cashier-legal-tender-grid';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { TextField } from '@/components/composites/text-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { FINERACT_LOCALE } from '@/lib/fineract/dates';
import { cashierInsufficientAmountMessage } from '@/lib/fineract/cashier-error-messages';
import { LEGAL_TENDER_HUB_PATH } from '@/lib/fineract/legal-tender-paths';

export function CashierCashActionSheet({
  open,
  onOpenChange,
  mode,
  tellerId,
  cashierId,
  currencyCode,
  preventCashierOverdraw = false,
  availableNetCash
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'allocate' | 'settle';
  tellerId: string | number;
  cashierId: string | number;
  currencyCode: string;
  preventCashierOverdraw?: boolean;
  availableNetCash?: number;
}) {
  const router = useRouter();
  const formId = useId();
  const initialTransactionDate = useInitialTransactionDate();
  const [txnDate, setTxnDate] = useState(initialTransactionDate);
  const [txnNote, setTxnNote] = useState('');
  const [tenders, setTenders] = useState<CurrencyLegalTender[]>([]);
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [quantities, setQuantities] = useState<LegalTenderQuantityMap>({});
  const [loadingTenders, setLoadingTenders] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAllocate = mode === 'allocate';
  const title = isAllocate ? 'Allocate cash' : 'Settle cash';
  const descriptionText = isAllocate
    ? 'Transfer cash from the vault to this cashier.'
    : 'Settle cash from this cashier back to the vault.';
  const showOverdrawGuard = !isAllocate && preventCashierOverdraw && availableNetCash != null;
  const formattedAvailableNetCash =
    showOverdrawGuard
      ? formatMoney(availableNetCash, currencyCode, FINERACT_LOCALE) ?? String(availableNetCash)
      : null;

  const totalAmount = useMemo(
    () => legalTenderTotalAmount(tenders, quantities, decimalPlaces),
    [decimalPlaces, quantities, tenders]
  );
  const hasPositiveLines = useMemo(
    () => buildLegalTenderLines(tenders, quantities).length > 0,
    [quantities, tenders]
  );
  const exceedsNetCash =
    showOverdrawGuard && totalAmount > 0 && totalAmount > (availableNetCash ?? 0);
  const canSubmit =
    !loadingTenders &&
    tenders.length > 0 &&
    hasPositiveLines &&
    totalAmount > 0 &&
    !exceedsNetCash;

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoadingTenders(true);
    setSubmitError(null);
    setFieldErrors({});
    setTxnDate(initialTransactionDate);
    setTxnNote('');
    void loadCashierCashActionSheetDataAction(currencyCode).then((result) => {
      if (cancelled) {
        return;
      }
      setLoadingTenders(false);
      if (!result.ok) {
        setSubmitError(result.message);
        setTenders([]);
        setQuantities({});
        return;
      }
      setTenders(result.tenders);
      setDecimalPlaces(result.decimalPlaces);
      setQuantities(emptyLegalTenderQuantities(result.tenders));
    });
    return () => {
      cancelled = true;
    };
  }, [open, currencyCode, initialTransactionDate]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTxnDate(initialTransactionDate);
      setTxnNote('');
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    if (!canSubmit) {
      return;
    }

    if (exceedsNetCash) {
      setSubmitError(cashierInsufficientAmountMessage());
      setFieldErrors({
        legalTenderLines: `Amount cannot exceed available net cash (${formattedAvailableNetCash}).`
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        currencyCode,
        txnAmount: totalAmount,
        txnDate,
        txnNote: txnNote.trim() || undefined,
        legalTenderLines: buildLegalTenderLines(tenders, quantities)
      };

      const result = isAllocate
        ? await allocateCashierCashAction(tellerId, cashierId, payload)
        : await settleCashierCashAction(tellerId, cashierId, payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(isAllocate ? 'Cash allocated.' : 'Cash settled.');
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={descriptionText}
      formId={formId}
      submitLabel={isAllocate ? 'Allocate' : 'Settle'}
      submitLoading={pending}
      submitDisabled={!canSubmit || pending}
      className="data-[side=right]:sm:max-w-3xl"
      error={submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null}
    >
      <form id={formId} onSubmit={handleSubmit} className="grid gap-4">
        {showOverdrawGuard ? (
          <p className="text-sm text-muted-foreground">
            Available net cash:{' '}
            <span className="font-medium text-foreground">{formattedAvailableNetCash}</span>
          </p>
        ) : null}

        {loadingTenders ? (
          <p className="text-sm text-muted-foreground">Loading denominations…</p>
        ) : (
          <>
            <CashierLegalTenderGrid
              currencyCode={currencyCode}
              decimalPlaces={decimalPlaces}
              tenders={tenders}
              quantities={quantities}
              onQuantitiesChange={setQuantities}
              disabled={pending}
            />
            {tenders.length === 0 ? (
              <p className="text-sm">
                <Link href={LEGAL_TENDER_HUB_PATH} className="text-primary underline-offset-4 hover:underline">
                  Set up legal tenders
                </Link>{' '}
                for {currencyCode} before posting cash movements.
              </p>
            ) : null}
            {fieldErrors.legalTenderLines ? (
              <p className="text-sm text-destructive">{fieldErrors.legalTenderLines}</p>
            ) : null}
          </>
        )}

        <TransactionDateField
          label="Transaction date"
          required
          value={txnDate}
          onChange={setTxnDate}
          error={fieldErrors.txnDate}
          disabled={pending}
        />

        <TextField
          label="Notes / comments"
          optional
          value={txnNote}
          onChange={setTxnNote}
          error={fieldErrors.txnNote}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

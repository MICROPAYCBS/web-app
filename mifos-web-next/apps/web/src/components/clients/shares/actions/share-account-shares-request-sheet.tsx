'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractShareAccountDetail } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { executeShareAccountSharesCommandAction } from '@/actions/share-account-command';
import { MoneyValue } from '@/components/composites';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { useLinkedSavingsBalance } from '@/hooks/use-linked-savings-balance';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { SHARE_OPS_COMMAND_TOAST } from '@/lib/fineract/share-account-command-toasts';
import { estimateSharePurchaseTotal } from '@/lib/fineract/share-account-use-savings';
import { shareAccountCurrencyCode } from '@/lib/fineract/share-account-display';

const FORM_ID = 'share-account-shares-request-form';

export function ShareAccountSharesRequestSheet({
  open,
  onOpenChange,
  clientId,
  account,
  kind
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  account: FineractShareAccountDetail;
  kind: 'applyAdditional' | 'redeem';
}) {
  const router = useRouter();
  const initialDate = useInitialTransactionDate();
  const [requestedDate, setRequestedDate] = useState(initialDate);
  const [requestedShares, setRequestedShares] = useState('');
  const [useSavings, setUseSavings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const isRedeem = kind === 'redeem';
  const currencyCode = shareAccountCurrencyCode(account);
  const {
    balance: linkedSavingsBalance,
    loading: linkedSavingsLoading
  } = useLinkedSavingsBalance(account.savingsAccountId, useSavings);

  const estimatedPurchaseTotal = useMemo(() => {
    if (isRedeem) {
      return null;
    }
    return estimateSharePurchaseTotal({
      requestedShares: Number(requestedShares),
      unitPrice: account.currentMarketPrice
    });
  }, [account.currentMarketPrice, isRedeem, requestedShares]);

  const insufficientSavings =
    !isRedeem &&
    useSavings &&
    linkedSavingsBalance?.availableBalance != null &&
    estimatedPurchaseTotal != null &&
    linkedSavingsBalance.availableBalance < estimatedPurchaseTotal;

  useEffect(() => {
    if (!open) {
      return;
    }
    setRequestedDate(initialDate);
    setRequestedShares('');
    setUseSavings(false);
    setError(null);
    setFieldErrors({});
  }, [open, initialDate, kind]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await executeShareAccountSharesCommandAction(
        clientId,
        String(account.id),
        isRedeem ? 'redeemshares' : 'applyadditionalshares',
        {
          requestedDate,
          requestedShares,
          ...(useSavings ? { useSavings: true } : {})
        }
      );
      if (
        !toastCommandOutcome(
          result,
          isRedeem ? SHARE_OPS_COMMAND_TOAST.redeem : SHARE_OPS_COMMAND_TOAST.applyAdditional
        )
      ) {
        if (!result.ok) {
          setError(formatActionErrorMessage(result.message, result.fieldErrors));
          setFieldErrors(result.fieldErrors ?? {});
        }
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
      title={isRedeem ? 'Redeem shares' : 'Apply additional shares'}
      description={
        isRedeem
          ? 'Redeem approved shares from this account.'
          : 'Request additional shares on this active account.'
      }
      formId={FORM_ID}
      submitLabel={isRedeem ? 'Redeem' : 'Apply'}
      submitLoading={pending}
      submitDisabled={insufficientSavings === true}
    >
      {error ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form id={FORM_ID} className="space-y-4" onSubmit={handleSubmit}>
        <TransactionDateField
          label="Requested date"
          value={requestedDate}
          onChange={setRequestedDate}
          error={fieldErrors.requestedDate}
          required
        />
        <NumericField
          label={isRedeem ? 'Shares to redeem' : 'Requested shares'}
          value={requestedShares}
          onChange={setRequestedShares}
          error={fieldErrors.requestedShares}
          required
        />
        <SwitchField
          label={
            isRedeem ? 'Credit proceeds to savings' : 'Use savings to fund purchase'
          }
          checked={useSavings}
          onCheckedChange={setUseSavings}
          disabled={account.savingsAccountId == null}
        />
        {useSavings ? (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {linkedSavingsLoading ? (
              <p>Loading savings balance…</p>
            ) : (
              <>
                <p>
                  Linked savings{' '}
                  <span className="font-medium text-foreground">
                    {account.savingsAccountNumber ??
                      linkedSavingsBalance?.accountNo ??
                      (account.savingsAccountId != null
                        ? `#${account.savingsAccountId}`
                        : '—')}
                  </span>
                  {linkedSavingsBalance?.availableBalance != null ? (
                    <>
                      {' '}
                      · Available{' '}
                      <MoneyValue
                        amount={linkedSavingsBalance.availableBalance}
                        currencyCode={
                          linkedSavingsBalance.currencyCode ?? currencyCode
                        }
                      />
                    </>
                  ) : null}
                </p>
                {!isRedeem && estimatedPurchaseTotal != null ? (
                  <p className="mt-1">
                    Estimated purchase{' '}
                    <MoneyValue
                      amount={estimatedPurchaseTotal}
                      currencyCode={currencyCode}
                    />{' '}
                    (shares × market price)
                  </p>
                ) : null}
                {isRedeem ? (
                  <p className="mt-1">
                    Net redemption proceeds will be deposited to the linked savings
                    account.
                  </p>
                ) : null}
                {insufficientSavings ? (
                  <p className="mt-1 text-destructive" role="alert">
                    Available balance is below the estimated purchase total.
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </form>
    </FormSheet>
  );
}

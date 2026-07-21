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
import { useEffect, useState, useTransition } from 'react';
import { executeShareAccountSharesCommandAction } from '@/actions/share-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { SHARE_OPS_COMMAND_TOAST } from '@/lib/fineract/share-account-command-toasts';

const FORM_ID = 'share-account-shares-request-form';

export function ShareAccountSharesRequestSheet({
  open,
  onOpenChange,
  clientId,
  accountId,
  kind
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  accountId: number;
  kind: 'applyAdditional' | 'redeem';
}) {
  const router = useRouter();
  const initialDate = useInitialTransactionDate();
  const [requestedDate, setRequestedDate] = useState(initialDate);
  const [requestedShares, setRequestedShares] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const isRedeem = kind === 'redeem';

  useEffect(() => {
    if (!open) {
      return;
    }
    setRequestedDate(initialDate);
    setRequestedShares('');
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
        String(accountId),
        isRedeem ? 'redeemshares' : 'applyadditionalshares',
        { requestedDate, requestedShares }
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
      </form>
    </FormSheet>
  );
}

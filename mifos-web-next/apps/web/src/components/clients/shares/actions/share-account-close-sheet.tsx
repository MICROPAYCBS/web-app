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
import { useEffect, useState, useTransition } from 'react';
import { executeShareAccountLifecycleCommandAction } from '@/actions/share-account-command';
import { MoneyValue } from '@/components/composites';
import { FormSheet } from '@/components/composites/form-sheet';
import { SwitchField } from '@/components/composites/switch-field';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { useLinkedSavingsBalance } from '@/hooks/use-linked-savings-balance';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { SHARE_LIFECYCLE_COMMAND_TOAST } from '@/lib/fineract/share-account-command-toasts';
import { shareAccountCurrencyCode } from '@/lib/fineract/share-account-display';

const FORM_ID = 'share-account-close-form';

export function ShareAccountCloseSheet({
  open,
  onOpenChange,
  clientId,
  account
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  account: FineractShareAccountDetail;
}) {
  const router = useRouter();
  const initialDate = useInitialTransactionDate();
  const [closedDate, setClosedDate] = useState(initialDate);
  const [note, setNote] = useState('');
  const [useSavings, setUseSavings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const currencyCode = shareAccountCurrencyCode(account);
  const {
    balance: linkedSavingsBalance,
    loading: linkedSavingsLoading
  } = useLinkedSavingsBalance(account.savingsAccountId, useSavings);

  useEffect(() => {
    if (!open) {
      return;
    }
    setClosedDate(initialDate);
    setNote('');
    setUseSavings(false);
    setError(null);
    setFieldErrors({});
  }, [open, initialDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await executeShareAccountLifecycleCommandAction(
        clientId,
        String(account.id),
        'close',
        {
          closedDate,
          note: note.trim() || undefined,
          ...(useSavings ? { useSavings: true } : {})
        }
      );
      if (!toastCommandOutcome(result, SHARE_LIFECYCLE_COMMAND_TOAST.close)) {
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
      title="Close share account"
      description="Closing redeems approved shares and closes the account."
      formId={FORM_ID}
      submitLabel="Close account"
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
          label="Closed on"
          value={closedDate}
          onChange={setClosedDate}
          error={fieldErrors.closedDate}
          required
        />
        <SwitchField
          label="Credit proceeds to savings"
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
                <p className="mt-1">
                  Net redemption proceeds from closing will be deposited to the linked
                  savings account.
                </p>
              </>
            )}
          </div>
        ) : null}
        <TextField label="Note" value={note} onChange={setNote} error={fieldErrors.note} />
      </form>
    </FormSheet>
  );
}

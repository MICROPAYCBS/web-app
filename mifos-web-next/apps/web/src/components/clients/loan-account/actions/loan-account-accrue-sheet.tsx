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
import { executeLoanAccountAccrueAction } from '@/actions/loan-account-accrue';
import { FormSheet } from '@/components/composites/form-sheet';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';

export function LoanAccountAccrueSheet({
  clientId,
  accountId,
  open,
  omitTillDate,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  open: boolean;
  omitTillDate: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialTransactionDate = useInitialTransactionDate();
  const [tillDate, setTillDate] = useState(initialTransactionDate);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    setFieldErrors({});
    setTillDate(initialTransactionDate);
  }, [open, initialTransactionDate]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeLoanAccountAccrueAction(clientId, String(accountId), {
        tillDate: omitTillDate ? undefined : tillDate
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

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Accrue"
      description={
        omitTillDate
          ? 'Compounding income already due before the business date will be posted.'
          : 'Post accruals for this loan through the business date, or stop on an earlier date.'
      }
      formId={formId}
      submitLabel="Accrue"
      submitLoading={pending}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {omitTillDate ? null : (
          <TransactionDateField
            id={`${formId}-till-date`}
            label="Accrue through"
            value={tillDate}
            onChange={setTillDate}
            error={fieldErrors.tillDate}
            optional
            disabled={pending}
            hint="Leave the business date to accrue through that day. Choose an earlier date to stop there."
          />
        )}
      </form>
    </FormSheet>
  );
}

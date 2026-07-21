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
import { executeShareAccountLifecycleCommandAction } from '@/actions/share-account-command';
import { FormSheet } from '@/components/composites/form-sheet';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { SHARE_LIFECYCLE_COMMAND_TOAST } from '@/lib/fineract/share-account-command-toasts';

const FORM_ID = 'share-account-close-form';

export function ShareAccountCloseSheet({
  open,
  onOpenChange,
  clientId,
  accountId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  accountId: number;
}) {
  const router = useRouter();
  const initialDate = useInitialTransactionDate();
  const [closedDate, setClosedDate] = useState(initialDate);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    setClosedDate(initialDate);
    setNote('');
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
        String(accountId),
        'close',
        { closedDate, note: note.trim() || undefined }
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
        <TextField label="Note" value={note} onChange={setNote} error={fieldErrors.note} />
      </form>
    </FormSheet>
  );
}

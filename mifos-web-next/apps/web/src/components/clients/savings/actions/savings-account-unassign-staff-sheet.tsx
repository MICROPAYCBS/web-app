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
import { executeSavingsAccountLifecycleCommandAction } from '@/actions/savings-account-command';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { dateToFineract } from '@/lib/fineract/date-input';

export function SavingsAccountUnassignStaffSheet({
  clientId,
  accountId,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [unassignedDate, setUnassignedDate] = useState(() => dateToFineract(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setUnassignedDate(dateToFineract(new Date()));
    setError(null);
    setFieldErrors({});
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountLifecycleCommandAction(
        clientId,
        String(accountId),
        'unassignSavingsOfficer',
        { unassignedDate }
      );

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
      title="Unassign field officer"
      description="Remove the field officer assigned to this savings account."
      formId={formId}
      submitLabel="Unassign officer"
      submitLoading={pending}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <DateField
          id={`${formId}-unassigned-date`}
          label="Unassignment date"
          value={unassignedDate}
          onChange={setUnassignedDate}
          error={fieldErrors.unassignedDate}
          required
          disabled={pending}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

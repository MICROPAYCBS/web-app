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
import {
  executeSavingsAccountLifecycleCommandAction,
  loadSavingsAccountAssignStaffSheetDataAction
} from '@/actions/savings-account-command';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';

export function SavingsAccountAssignStaffSheet({
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
  const [loading, setLoading] = useState(false);
  const [staffOptions, setStaffOptions] = useState<{ id: number; name: string }[]>([]);
  const [toSavingsOfficerId, setToSavingsOfficerId] = useState('');
  const initialTransactionDate = useInitialTransactionDate();
  const [assignmentDate, setAssignmentDate] = useState(initialTransactionDate);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setToSavingsOfficerId('');
    setAssignmentDate(initialTransactionDate);
    void loadSavingsAccountAssignStaffSheetDataAction(clientId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setStaffOptions([]);
        return;
      }
      setStaffOptions(result.staffOptions);
    });
    return () => {
      cancelled = true;
    };
  }, [open, clientId, initialTransactionDate]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeSavingsAccountLifecycleCommandAction(
        clientId,
        String(accountId),
        'assignSavingsOfficer',
        { toSavingsOfficerId, assignmentDate }
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
      title="Assign field officer"
      description="Assign a field officer to this savings account."
      formId={formId}
      submitLabel="Assign officer"
      submitLoading={pending}
      submitDisabled={loading}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading field officers…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            id={`${formId}-officer`}
            label="Field officer"
            value={toSavingsOfficerId}
            onValueChange={(value) => setToSavingsOfficerId(value ?? '')}
            options={staffOptions.map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="Select field officer"
            error={fieldErrors.toSavingsOfficerId}
            required
            disabled={pending}
          />
          <TransactionDateField
            id={`${formId}-assignment-date`}
            label="Assignment date"
            value={assignmentDate}
            onChange={setAssignmentDate}
            error={fieldErrors.assignmentDate}
            required
            disabled={pending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      )}
    </FormSheet>
  );
}

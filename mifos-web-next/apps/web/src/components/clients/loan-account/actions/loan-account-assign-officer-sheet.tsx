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
  executeLoanAccountAssignOfficerAction,
  loadLoanAccountAssignOfficerSheetDataAction
} from '@/actions/loan-account-officer';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';

export function LoanAccountAssignOfficerSheet({
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
  const [officerOptions, setOfficerOptions] = useState<{ id: number; name: string }[]>([]);
  const [toLoanOfficerId, setToLoanOfficerId] = useState('');
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
    setToLoanOfficerId('');
    setAssignmentDate(initialTransactionDate);
    void loadLoanAccountAssignOfficerSheetDataAction(String(accountId)).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setOfficerOptions([]);
        return;
      }
      setOfficerOptions(result.officerOptions);
    });
    return () => {
      cancelled = true;
    };
  }, [open, accountId, initialTransactionDate]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeLoanAccountAssignOfficerAction(
        clientId,
        String(accountId),
        { toLoanOfficerId, assignmentDate }
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
      title="Assign loan officer"
      description="Assign a loan officer to this loan account."
      formId={formId}
      submitLabel="Assign officer"
      submitLoading={pending}
      submitDisabled={loading}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading loan officers…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            id={`${formId}-officer`}
            label="Loan officer"
            value={toLoanOfficerId}
            onValueChange={(value) => setToLoanOfficerId(value ?? '')}
            options={officerOptions.map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="Select loan officer"
            error={fieldErrors.toLoanOfficerId}
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

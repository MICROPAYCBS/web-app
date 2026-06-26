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
  executeLoanAccountReassignOfficerAction,
  loadLoanAccountReassignOfficerSheetDataAction
} from '@/actions/loan-account-officer';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';

export function LoanAccountReassignOfficerSheet({
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
  const [currentOfficerName, setCurrentOfficerName] = useState<string | null>(null);
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
    void loadLoanAccountReassignOfficerSheetDataAction(String(accountId)).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setOfficerOptions([]);
        setCurrentOfficerName(null);
        return;
      }
      setOfficerOptions(result.officerOptions);
      setCurrentOfficerName(result.currentOfficerName);
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
      const result = await executeLoanAccountReassignOfficerAction(
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

  const noAlternatives = !loading && officerOptions.length === 0;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Reassign loan officer"
      description="Replace the current loan officer with another officer."
      formId={formId}
      submitLabel="Reassign officer"
      submitLoading={pending}
      submitDisabled={loading || noAlternatives}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading loan officers…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current officer:{' '}
            <span className="text-foreground">{currentOfficerName ?? '—'}</span>
          </p>
          {noAlternatives && !error ? (
            <p className="text-sm text-muted-foreground">
              No other loan officers are available to reassign this loan to.
            </p>
          ) : null}
          <SelectField
            id={`${formId}-officer`}
            label="New loan officer"
            value={toLoanOfficerId}
            onValueChange={(value) => setToLoanOfficerId(value ?? '')}
            options={officerOptions.map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder="Select loan officer"
            error={fieldErrors.toLoanOfficerId}
            required
            disabled={pending || noAlternatives}
          />
          <TransactionDateField
            id={`${formId}-assignment-date`}
            label="Reassignment date"
            value={assignmentDate}
            onChange={setAssignmentDate}
            error={fieldErrors.assignmentDate}
            required
            disabled={pending || noAlternatives}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      )}
    </FormSheet>
  );
}

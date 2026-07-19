'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientDepositAccountKind } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import {
  executeDepositAccountReassignOfficerAction,
  loadDepositAccountReassignOfficerSheetDataAction
} from '@/actions/deposit-account-officer';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { DEPOSIT_FIELD_OFFICER_CONFIG } from '@/lib/fineract/account-field-officer-config';

export function DepositAccountReassignOfficerSheet({
  clientId,
  accountId,
  kind,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  kind: ClientDepositAccountKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const config = DEPOSIT_FIELD_OFFICER_CONFIG[kind];
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [currentOfficerName, setCurrentOfficerName] = useState<string | null>(null);
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
    void loadDepositAccountReassignOfficerSheetDataAction(
      clientId,
      kind,
      String(accountId)
    ).then((result) => {
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setStaffOptions([]);
        setCurrentOfficerName(null);
        return;
      }
      setStaffOptions(result.staffOptions);
      setCurrentOfficerName(result.currentOfficerName);
    });
    return () => {
      cancelled = true;
    };
  }, [open, clientId, kind, accountId, initialTransactionDate]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await executeDepositAccountReassignOfficerAction(
        clientId,
        kind,
        String(accountId),
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

  const noAlternatives = !loading && staffOptions.length === 0;

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Reassign ${config.officerLabel.toLowerCase()}`}
      description={`Replace the current ${config.officerLabel.toLowerCase()} with another officer.`}
      formId={formId}
      submitLabel="Reassign officer"
      submitLoading={pending}
      submitDisabled={loading || noAlternatives}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading officers…</p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current officer:{' '}
            <span className="text-foreground">{currentOfficerName ?? '—'}</span>
          </p>
          {noAlternatives && !error ? (
            <p className="text-sm text-muted-foreground">
              No other {config.officerLabel.toLowerCase()}s are available to reassign this account
              to.
            </p>
          ) : null}
          <SelectField
            id={`${formId}-officer`}
            label={`New ${config.officerLabel.toLowerCase()}`}
            value={toSavingsOfficerId}
            onValueChange={(value) => setToSavingsOfficerId(value ?? '')}
            options={staffOptions.map((row) => ({ value: String(row.id), label: row.name }))}
            placeholder={`Select ${config.officerLabel.toLowerCase()}`}
            error={fieldErrors.toSavingsOfficerId}
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

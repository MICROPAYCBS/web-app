'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { loanAccountMarkAsNpaCommandSchema } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';
import { loadLoanNpaReasonsAction, markLoanAsNpaAction } from '@/actions/loan-account-npa';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import type { LoanNpaReasonOption } from '@/lib/fineract/loan-npa';

const PLACED_FIELDS = new Set(['npaReasonId', 'note']);

function footerError(message: string, fieldErrors?: Record<string, string>): string | null {
  const unmapped: string[] = [];
  let shownOnField = false;
  for (const [field, text] of Object.entries(fieldErrors ?? {})) {
    if (!text) {
      continue;
    }
    if (PLACED_FIELDS.has(field)) {
      shownOnField = true;
      continue;
    }
    unmapped.push(text);
  }
  if (unmapped.length > 0) {
    return unmapped.join('\n');
  }
  if (shownOnField) {
    return null;
  }
  const trimmed = message.trim();
  return trimmed && trimmed !== 'Fix the highlighted fields.' ? message : null;
}

function fieldErrorsFromIssues(
  issues: { path: (string | number)[]; message: string }[]
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export function LoanAccountMarkNpaSheet({
  clientId,
  accountId,
  alreadyNonPerforming,
  open,
  onOpenChange
}: {
  clientId: string;
  accountId: number;
  alreadyNonPerforming: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const formId = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [reasons, setReasons] = useState<LoanNpaReasonOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reasonId, setReasonId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setReasonId('');
    setNote('');
    setError(null);
    setFieldErrors({});
    setLoadError(null);
    setReasons([]);
    let cancelled = false;
    setLoadingReasons(true);
    void loadLoanNpaReasonsAction().then((result) => {
      if (cancelled) {
        return;
      }
      setLoadingReasons(false);
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setReasons(result.reasons);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const reasonsEmpty = !loadingReasons && !loadError && reasons.length === 0;
  const emptyReasonMessage = reasonsEmpty ? 'An administrator must add an NPA reason.' : null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || loadingReasons || reasonsEmpty || loadError) {
      return;
    }
    setError(null);
    const parsed = loanAccountMarkAsNpaCommandSchema.safeParse({
      npaReasonId: reasonId || undefined,
      note
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromIssues(parsed.error.issues));
      return;
    }
    setFieldErrors({});

    startTransition(async () => {
      const result = await markLoanAsNpaAction(clientId, String(accountId), parsed.data);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(footerError(result.message, result.fieldErrors));
        return;
      }
      toastCommandOutcome(result, {
        completed: alreadyNonPerforming
          ? 'Deliberate classification recorded.'
          : 'Loan marked as non-performing.',
        pending: 'Mark as non-performing is awaiting approval.'
      });
      onOpenChange(false);
      if (!result.pendingChecker) {
        router.refresh();
      }
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Mark as NPA"
      description={
        alreadyNonPerforming
          ? 'This loan is already non-performing. This records the deliberate reason. The loan stays non-performing.'
          : 'This classifies the loan as non-performing now. Accrual and interest recalculation stop. No accounting entry is posted.'
      }
      formId={formId}
      submitLabel="Mark as NPA"
      submitLoading={pending}
      submitDisabled={loadingReasons || reasonsEmpty || Boolean(loadError) || !reasonId}
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {error || emptyReasonMessage ? (
          <p className="text-sm whitespace-pre-line text-destructive">
            {error ?? emptyReasonMessage}
          </p>
        ) : null}
        <SelectField
          id={`${formId}-reason`}
          label="Reason"
          required
          value={reasonId}
          onValueChange={(value) => {
            setReasonId(value ?? '');
            if (fieldErrors.npaReasonId) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.npaReasonId;
                return next;
              });
            }
          }}
          options={reasons.map((reason) => ({ value: String(reason.id), label: reason.name }))}
          placeholder="Select a reason"
          loading={loadingReasons}
          loadError={loadError ?? undefined}
          error={fieldErrors.npaReasonId}
          disabled={pending}
          emptyMessage="An administrator must add an NPA reason."
        />
        <TextField
          id={`${formId}-note`}
          label="Note"
          optional
          multiline
          rows={3}
          maxLength={500}
          value={note}
          onChange={(value) => {
            setNote(value);
            if (fieldErrors.note) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.note;
                return next;
              });
            }
          }}
          error={fieldErrors.note}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

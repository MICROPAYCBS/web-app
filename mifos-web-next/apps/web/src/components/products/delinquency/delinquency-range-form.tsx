'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { DelinquencyRangeDetail } from '@mifos/api-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createDelinquencyRangeAction,
  updateDelinquencyRangeAction
} from '@/actions/delinquency-range';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { TextField } from '@/components/composites/text-field';
import {
  delinquencyRangeDetailPath,
  delinquencyRangesListPath
} from '@/lib/fineract/delinquency-paths';

export const CREATE_DELINQUENCY_RANGE_FORM_ID = 'create-delinquency-range-form';
export const EDIT_DELINQUENCY_RANGE_FORM_ID = 'edit-delinquency-range-form';

export function DelinquencyRangeCreateSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [classification, setClassification] = useState('');
  const [minimumAgeDays, setMinimumAgeDays] = useState('');
  const [maximumAgeDays, setMaximumAgeDays] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setClassification('');
    setMinimumAgeDays('');
    setMaximumAgeDays('');
    setFieldErrors({});
    setSubmitError(null);
  }, [open]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createDelinquencyRangeAction({
        classification,
        minimumAgeDays,
        maximumAgeDays: maximumAgeDays || undefined
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Delinquency range created.');
      onOpenChange(false);
      const id = result.resourceId;
      router.push(id ? delinquencyRangeDetailPath(id) : delinquencyRangesListPath());
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create delinquency range"
      description="Define the classification and overdue day boundaries."
      formId={CREATE_DELINQUENCY_RANGE_FORM_ID}
      submitLabel="Create"
      submitLoading={pending}
    >
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}
      <form id={CREATE_DELINQUENCY_RANGE_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Classification"
          required
          value={classification}
          onChange={setClassification}
          error={fieldErrors.classification}
          disabled={pending}
        />
        <NumericField
          label="Days from"
          required
          value={minimumAgeDays}
          onChange={setMinimumAgeDays}
          error={fieldErrors.minimumAgeDays}
          disabled={pending}
        />
        <NumericField
          label="Days till"
          value={maximumAgeDays}
          onChange={setMaximumAgeDays}
          error={fieldErrors.maximumAgeDays}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

export function DelinquencyRangeEditSheet({
  range,
  open,
  onOpenChange
}: {
  range: DelinquencyRangeDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [classification, setClassification] = useState(range.classification ?? '');
  const [minimumAgeDays, setMinimumAgeDays] = useState(
    range.minimumAgeDays !== undefined ? String(range.minimumAgeDays) : ''
  );
  const [maximumAgeDays, setMaximumAgeDays] = useState(
    range.maximumAgeDays !== undefined ? String(range.maximumAgeDays) : ''
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setClassification(range.classification ?? '');
    setMinimumAgeDays(range.minimumAgeDays !== undefined ? String(range.minimumAgeDays) : '');
    setMaximumAgeDays(range.maximumAgeDays !== undefined ? String(range.maximumAgeDays) : '');
    setFieldErrors({});
    setSubmitError(null);
  }, [open, range]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateDelinquencyRangeAction(String(range.id), {
        classification,
        minimumAgeDays,
        maximumAgeDays: maximumAgeDays || undefined
      });

      if (!result.ok) {
        setSubmitError(result.message);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success('Delinquency range updated.');
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Edit delinquency range"
      description={range.classification ?? 'Update delinquency range details.'}
      formId={EDIT_DELINQUENCY_RANGE_FORM_ID}
      submitLabel="Save changes"
      submitLoading={pending}
    >
      {submitError ? (
        <p
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}
      <form id={EDIT_DELINQUENCY_RANGE_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Classification"
          required
          value={classification}
          onChange={setClassification}
          error={fieldErrors.classification}
          disabled={pending}
        />
        <NumericField
          label="Days from"
          required
          value={minimumAgeDays}
          onChange={setMinimumAgeDays}
          error={fieldErrors.minimumAgeDays}
          disabled={pending}
        />
        <NumericField
          label="Days till"
          value={maximumAgeDays}
          onChange={setMaximumAgeDays}
          error={fieldErrors.maximumAgeDays}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractDatatableColumnHeader } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useState } from 'react';
import { DatatableFields } from '@/components/clients/shared/datatable-fields';
import { FormSheet } from '@/components/composites/form-sheet';
import type { FormSubmitResult } from '@/lib/form/submit-result';

type DatatableSaveResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function ClientDatatableFormSheet({
  open,
  onOpenChange,
  title,
  description,
  columns,
  values,
  onSave,
  submitLabel = 'Save'
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  columns: FineractDatatableColumnHeader[];
  values: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<DatatableSaveResult>;
  submitLabel?: string;
}) {
  const [draft, setDraft] = useState(values);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(values);
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});
    const result = await onSave(draft);
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.message);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      return;
    }
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      submitLabel={submitLabel}
      submitLoading={submitting}
      onSubmit={handleSubmit}
      className="data-[side=right]:sm:max-w-2xl"
    >
      {submitError ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formatActionErrorMessage(submitError, fieldErrors)}
        </p>
      ) : null}
      <DatatableFields
        columns={columns}
        values={draft}
        errors={fieldErrors}
        onChange={setDraft}
      />
    </FormSheet>
  );
}

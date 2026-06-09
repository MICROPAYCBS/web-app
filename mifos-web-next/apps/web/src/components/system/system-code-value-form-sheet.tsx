'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCodeValue } from '@mifos/api-client';
import { validateUpsertCodeValue, type UpsertCodeValueInput } from '@mifos/validation';
import { useEffect, useId, useMemo, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import type { FormSubmitResult } from '@/lib/form/submit-result';

function codeValueIsActive(value: FineractCodeValue): boolean {
  return value.isActive ?? value.active ?? false;
}

function toFormInput(value: FineractCodeValue): UpsertCodeValueInput {
  return {
    name: value.name ?? '',
    description: value.description ?? '',
    position: value.position ?? 0,
    isActive: codeValueIsActive(value)
  };
}

function defaultFormInput(defaultPosition: number): UpsertCodeValueInput {
  return {
    name: '',
    description: '',
    position: defaultPosition,
    isActive: true
  };
}

export function SystemCodeValueFormSheet({
  open,
  onOpenChange,
  value,
  defaultPosition,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: FineractCodeValue;
  defaultPosition: number;
  onSave: (input: UpsertCodeValueInput, valueId?: number) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const isEdit = value != null;
  const [form, setForm] = useState<UpsertCodeValueInput>(() =>
    value ? toFormInput(value) : defaultFormInput(defaultPosition)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useMemo(
    () => (value ? toFormInput(value) : defaultFormInput(defaultPosition)),
    [value, defaultPosition]
  );

  useEffect(() => {
    if (open) {
      setForm(resetForm);
      setFieldErrors({});
      setError(null);
    }
  }, [open, resetForm]);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    onOpenChange(next);
  }

  function validateForm(): boolean {
    const parsed = validateUpsertCodeValue(form);
    if (parsed.success) {
      setFieldErrors({});
      return true;
    }
    const nextFieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string') {
        nextFieldErrors[key] = issue.message;
      }
    }
    setFieldErrors(nextFieldErrors);
    setError('Fix the highlighted fields.');
    return false;
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }
    if (!validateForm()) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onSave(form, value?.id);
      if (result.ok) {
        handleOpenChange(false);
        return;
      }
      setError(result.message);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? 'Edit code value' : 'Add code value'}
      description="Values appear in dropdowns and lookups that reference this code."
      formId={formId}
      submitLabel={isEdit ? 'Save changes' : 'Add value'}
      onSubmit={handleSubmit}
      submitLoading={isSubmitting || submitLoading}
      className="data-[side=right]:sm:max-w-md"
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <TextField
          id={`${formId}-name`}
          label="Name"
          required
          value={form.name}
          onChange={(name) => {
            setForm((current) => ({ ...current, name }));
            if (fieldErrors.name) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.name;
                return next;
              });
            }
          }}
          error={fieldErrors.name}
        />
        <TextField
          id={`${formId}-description`}
          label="Description"
          optional
          value={form.description ?? ''}
          onChange={(description) => setForm((current) => ({ ...current, description }))}
          error={fieldErrors.description}
        />
        <NumericField
          id={`${formId}-position`}
          label="Position"
          required
          integer
          value={String(form.position ?? 0)}
          onChange={(position) => {
            setForm((current) => ({
              ...current,
              position: position ? Number.parseInt(position, 10) : 0
            }));
            if (fieldErrors.position) {
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.position;
                return next;
              });
            }
          }}
          error={fieldErrors.position}
        />
        <SwitchField
          id={`${formId}-active`}
          label="Active"
          optional
          checked={form.isActive ?? false}
          onCheckedChange={(isActive) => setForm((current) => ({ ...current, isActive }))}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </FormSheet>
  );
}

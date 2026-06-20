'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption } from '@mifos/api-client';
import type { CreateOfficeInput, UpdateOfficeInput } from '@mifos/validation';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { createOfficeAction, updateOfficeAction } from '@/actions/office';
import { DateField } from '@/components/composites/date-field';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fineractApiDateToFormString,
  toFineractDate
} from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';

type BranchFormState = {
  name: string;
  parentId: string;
  openingDate: string;
  externalId: string;
};

export type BranchFormInitial = {
  name?: string;
  parentId?: number;
  openingDate?: number[] | string;
  externalId?: string;
};

function defaultFormState(): BranchFormState {
  return {
    name: '',
    parentId: '',
    openingDate: toFineractDate(),
    externalId: ''
  };
}

function formStateFromInitial(initial?: BranchFormInitial): BranchFormState {
  if (!initial) {
    return defaultFormState();
  }
  return {
    name: initial.name ?? '',
    parentId: initial.parentId ? String(initial.parentId) : '',
    openingDate: fineractApiDateToFormString(initial.openingDate) ?? toFineractDate(),
    externalId: initial.externalId ?? ''
  };
}

function toCreatePayload(form: BranchFormState): CreateOfficeInput {
  return {
    name: form.name.trim(),
    parentId: Number(form.parentId),
    openingDate: form.openingDate,
    externalId: form.externalId.trim(),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

function toUpdatePayload(form: BranchFormState, includeParent: boolean): UpdateOfficeInput {
  const base = {
    name: form.name.trim(),
    openingDate: form.openingDate,
    externalId: form.externalId.trim(),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
  if (!includeParent) {
    return base;
  }
  return {
    ...base,
    parentId: Number(form.parentId)
  };
}

const MIN_OPENING_DATE = new Date(2000, 0, 1);

export function BranchFormSheet({
  open,
  onOpenChange,
  mode,
  parentOptions,
  officeId,
  initial,
  showParentField = true
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  parentOptions: FineractOfficeOption[];
  officeId?: number;
  initial?: BranchFormInitial;
  showParentField?: boolean;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<BranchFormState>(() => formStateFromInitial(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parentSelectOptions = useMemo(
    () =>
      toSelectOptions(
        parentOptions.map((office) => ({
          id: office.id,
          name: office.nameDecorated ?? office.name
        }))
      ),
    [parentOptions]
  );

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setForm(formStateFromInitial(initial));
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  function patchForm(patch: Partial<BranchFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createOfficeAction(toCreatePayload(form))
          : await updateOfficeAction(
              officeId!,
              toUpdatePayload(form, showParentField && form.parentId.trim().length > 0)
            );

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      handleOpenChange(false);
      if (mode === 'create' && result.officeId != null) {
        router.push(`/organization/offices/${result.officeId}`);
      } else {
        router.refresh();
      }
    });
  }

  const canSubmit =
    form.name.trim().length > 0 &&
    form.openingDate.trim().length > 0 &&
    (mode === 'edit' && !showParentField ? true : form.parentId.trim().length > 0);

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create branch' : 'Edit branch'}
      description={
        mode === 'create'
          ? 'Add a new branch to your institution hierarchy.'
          : 'Update branch details and parent assignment.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create branch' : 'Save changes'}
      submitDisabled={!canSubmit}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
      error={
        submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null
      }
    >
      <form id={formId} className="grid gap-4" onSubmit={handleSubmit}>
        <TextField
          id={`${formId}-name`}
          label="Name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          error={fieldErrors.name}
        />
        {showParentField ? (
          <SelectField
            id={`${formId}-parentId`}
            label="Parent branch"
            required
            value={form.parentId || undefined}
            onValueChange={(value) => patchForm({ parentId: value ?? '' })}
            options={parentSelectOptions}
            placeholder="Select parent branch"
            error={fieldErrors.parentId}
          />
        ) : null}
        <DateField
          id={`${formId}-openingDate`}
          label="Opening date"
          required
          value={form.openingDate}
          onChange={(value) => patchForm({ openingDate: value ?? '' })}
          error={fieldErrors.openingDate}
          fromDate={MIN_OPENING_DATE}
        />
        <TextField
          id={`${formId}-externalId`}
          label="External ID"
          optional
          value={form.externalId}
          onChange={(value) => patchForm({ externalId: value })}
          error={fieldErrors.externalId}
        />
      </form>
    </FormSheet>
  );
}

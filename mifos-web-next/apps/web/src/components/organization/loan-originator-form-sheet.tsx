'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { LoanOriginatorDetail, LoanOriginatorTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createLoanOriginatorAction,
  updateLoanOriginatorAction
} from '@/actions/loan-originators';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { formatLoanOriginatorStatus } from '@/lib/fineract/loan-originator-display';
import { toSelectOptions } from '@/lib/form/select-options';

type LoanOriginatorFormState = {
  externalId: string;
  name: string;
  status: string;
  originatorTypeId: string;
  channelTypeId: string;
};

function defaultFormState(template: LoanOriginatorTemplate): LoanOriginatorFormState {
  return {
    externalId: template.externalId ?? '',
    name: '',
    status: '',
    originatorTypeId: '',
    channelTypeId: ''
  };
}

function formStateFromOriginator(originator: LoanOriginatorDetail): LoanOriginatorFormState {
  return {
    externalId: originator.externalId,
    name: originator.name,
    status: originator.status,
    originatorTypeId:
      originator.originatorType?.id != null ? String(originator.originatorType.id) : '',
    channelTypeId:
      originator.channelType?.id != null ? String(originator.channelType.id) : ''
  };
}

export function LoanOriginatorFormSheet({
  open,
  onOpenChange,
  mode,
  template,
  originator
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  template: LoanOriginatorTemplate;
  originator?: LoanOriginatorDetail;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<LoanOriginatorFormState>(() =>
    originator ? formStateFromOriginator(originator) : defaultFormState(template)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const statusOptions = useMemo(
    () =>
      template.statusOptions.map((status) => ({
        value: status,
        label: formatLoanOriginatorStatus(status)
      })),
    [template.statusOptions]
  );

  const originatorTypeOptions = useMemo(
    () => toSelectOptions(template.originatorTypeOptions),
    [template.originatorTypeOptions]
  );

  const channelTypeOptions = useMemo(
    () => toSelectOptions(template.channelTypeOptions),
    [template.channelTypeOptions]
  );

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setForm(originator ? formStateFromOriginator(originator) : defaultFormState(template));
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  function patchForm(patch: Partial<LoanOriginatorFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const sharedPayload = {
      name: form.name,
      status: form.status,
      originatorTypeId: form.originatorTypeId ? Number(form.originatorTypeId) : undefined,
      channelTypeId: form.channelTypeId ? Number(form.channelTypeId) : undefined
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createLoanOriginatorAction({
              externalId: form.externalId,
              ...sharedPayload
            })
          : await updateLoanOriginatorAction(String(originator!.id), sharedPayload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toast.success(
        mode === 'create' ? 'Loan originator created.' : 'Loan originator updated.'
      );
      handleOpenChange(false);
      router.refresh();
    });
  }

  const canSubmit =
    form.name.trim().length > 0 &&
    form.status.trim().length > 0 &&
    (mode === 'edit' || form.externalId.trim().length > 0);

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create loan originator' : 'Edit loan originator'}
      description={
        mode === 'create'
          ? 'Add a loan originator that can be attached to loan accounts.'
          : 'Update loan originator details.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create loan originator' : 'Save changes'}
      submitDisabled={!canSubmit}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form id={formId} className="grid gap-4" onSubmit={handleSubmit}>
        {submitError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
        <TextField
          id={`${formId}-name`}
          label="Name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          error={fieldErrors.name}
          disabled={pending}
        />
        <TextField
          id={`${formId}-external-id`}
          label="External ID"
          required={mode === 'create'}
          value={form.externalId}
          onChange={(value) => patchForm({ externalId: value })}
          error={fieldErrors.externalId}
          disabled={pending || mode === 'edit'}
          hint={mode === 'edit' ? 'External ID cannot be changed after creation.' : undefined}
        />
        <SelectField
          id={`${formId}-status`}
          label="Status"
          required
          value={form.status}
          onValueChange={(value) => patchForm({ status: value ?? '' })}
          options={statusOptions}
          error={fieldErrors.status}
          disabled={pending}
        />
        <SelectField
          id={`${formId}-originator-type`}
          label="Originator type"
          value={form.originatorTypeId}
          onValueChange={(value) => patchForm({ originatorTypeId: value ?? '' })}
          options={originatorTypeOptions}
          error={fieldErrors.originatorTypeId}
          disabled={pending}
        />
        <SelectField
          id={`${formId}-channel-type`}
          label="Channel type"
          value={form.channelTypeId}
          onValueChange={(value) => patchForm({ channelTypeId: value ?? '' })}
          options={channelTypeOptions}
          error={fieldErrors.channelTypeId}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption, OrganizationTeller } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { createTellerAction, updateTellerAction } from '@/actions/teller';
import { DateField } from '@/components/composites/date-field';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fineractApiDateToFormString,
  parseFineractDateString,
  toFineractDate
} from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';
import {
  TELLER_STATUS_OPTIONS,
  tellerStatusToFormValue
} from '@/lib/fineract/teller-display';

type TellerFormState = {
  officeId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type TellerFormInitial = {
  officeId?: number;
  name?: string;
  description?: string;
  startDate?: number[] | string;
  endDate?: number[] | string;
  status?: string | number;
};

const MIN_START_DATE = new Date(2000, 0, 1);

function defaultFormState(): TellerFormState {
  return {
    officeId: '',
    name: '',
    description: '',
    startDate: toFineractDate(),
    endDate: '',
    status: String(TELLER_STATUS_OPTIONS[0].id)
  };
}

function formStateFromInitial(initial?: TellerFormInitial): TellerFormState {
  if (!initial) {
    return defaultFormState();
  }
  return {
    officeId: initial.officeId ? String(initial.officeId) : '',
    name: initial.name ?? '',
    description: initial.description ?? '',
    startDate: fineractApiDateToFormString(initial.startDate) ?? toFineractDate(),
    endDate: fineractApiDateToFormString(initial.endDate) ?? '',
    status: tellerStatusToFormValue(initial.status)
  };
}

function formStateFromTeller(teller: OrganizationTeller): TellerFormState {
  return {
    officeId: String(teller.officeId),
    name: teller.name,
    description: teller.description ?? '',
    startDate: fineractApiDateToFormString(teller.startDate) ?? toFineractDate(),
    endDate: fineractApiDateToFormString(teller.endDate) ?? '',
    status: tellerStatusToFormValue(teller.status)
  };
}

export function TellerFormSheet({
  open,
  onOpenChange,
  mode,
  offices,
  teller,
  initial
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  offices: FineractOfficeOption[];
  teller?: OrganizationTeller;
  initial?: TellerFormInitial;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<TellerFormState>(() =>
    teller ? formStateFromTeller(teller) : formStateFromInitial(initial)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const officeOptions = useMemo(
    () =>
      toSelectOptions(
        offices.map((office) => ({
          id: office.id,
          name: office.nameDecorated ?? office.name
        }))
      ),
    [offices]
  );

  const statusOptions = useMemo(
    () =>
      TELLER_STATUS_OPTIONS.map((option) => ({
        value: String(option.id),
        label: option.label
      })),
    []
  );

  const startDateValue = form.startDate ? parseFineractDateString(form.startDate) : null;

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      setForm(teller ? formStateFromTeller(teller) : formStateFromInitial(initial));
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  function patchForm(patch: Partial<TellerFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const payload = {
      officeId: Number(form.officeId),
      name: form.name,
      description: form.description.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate.trim() || undefined,
      status: Number(form.status),
      dateFormat: FINERACT_DATE_FORMAT,
      locale: FINERACT_LOCALE
    };

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createTellerAction(payload)
          : await updateTellerAction(teller!.id, payload);

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      toastCommandOutcome(result, { completed: mode === 'create' ? 'Teller created.' : 'Teller updated.', pending: mode === 'create' ? 'Teller creation sent for approval.' : 'Teller update sent for approval.' });
      handleOpenChange(false);
      if (mode === 'create' && result.tellerId != null) {
        router.push(`/organization/tellers/${result.tellerId}`);
      } else {
        router.refresh();
      }
    });
  }

  const canSubmit =
    form.officeId.trim().length > 0 &&
    form.name.trim().length > 0 &&
    form.startDate.trim().length > 0 &&
    form.status.trim().length > 0;

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create teller' : 'Edit teller'}
      description={
        mode === 'create'
          ? 'Register a teller window at a branch for cashier operations.'
          : 'Update teller details. Branch assignment cannot be changed after creation.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create teller' : 'Save changes'}
      submitDisabled={!canSubmit}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
      error={
        submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null
      }
    >
      <form id={formId} className="grid gap-4" onSubmit={handleSubmit}>
        <SelectField
          id={`${formId}-officeId`}
          label="Branch"
          required
          value={form.officeId || undefined}
          onValueChange={(value) => patchForm({ officeId: value ?? '' })}
          options={officeOptions}
          placeholder="Select branch"
          error={fieldErrors.officeId}
          disabled={mode === 'edit' || pending}
        />
        <TextField
          id={`${formId}-name`}
          label="Teller name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          error={fieldErrors.name}
          disabled={pending}
        />
        <div className="space-y-2">
          <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
          <Textarea
            id={`${formId}-description`}
            rows={3}
            value={form.description}
            onChange={(event) => patchForm({ description: event.target.value })}
            disabled={pending}
          />
        </div>
        <DateField
          id={`${formId}-startDate`}
          label="Start date"
          required
          value={form.startDate}
          onChange={(value) => patchForm({ startDate: value ?? '' })}
          error={fieldErrors.startDate}
          fromDate={MIN_START_DATE}
          disabled={pending}
        />
        <DateField
          id={`${formId}-endDate`}
          label="End date"
          optional
          value={form.endDate || undefined}
          onChange={(value) => patchForm({ endDate: value ?? '' })}
          error={fieldErrors.endDate}
          fromDate={startDateValue ?? MIN_START_DATE}
          disabled={pending}
        />
        <SelectField
          id={`${formId}-status`}
          label="Status"
          required
          value={form.status || undefined}
          onValueChange={(value) => patchForm({ status: value ?? '' })}
          options={statusOptions}
          placeholder="Select status"
          error={fieldErrors.status}
          disabled={pending}
        />
      </form>
    </FormSheet>
  );
}

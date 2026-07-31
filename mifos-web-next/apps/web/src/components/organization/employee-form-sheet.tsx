'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption } from '@mifos/api-client';
import {
  formatActionErrorMessage,
  stripPhoneSpaces,
  UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER,
  UGANDA_PHONE_INTERNATIONAL_HINT,
  type CreateStaffInput,
  type UpdateStaffInput
} from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { createStaffAction, updateStaffAction } from '@/actions/staff';
import { DateField } from '@/components/composites/date-field';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fineractApiDateToFormString,
  toFineractDate
} from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';

type EmployeeFormState = {
  officeId: string;
  firstname: string;
  lastname: string;
  isLoanOfficer: boolean;
  mobileNo: string;
  joiningDate: string;
  isActive: boolean;
};

export type EmployeeFormInitial = {
  officeId?: number;
  firstname?: string;
  lastname?: string;
  isLoanOfficer?: boolean;
  mobileNo?: string;
  joiningDate?: number[] | string;
  isActive?: boolean;
};

function defaultFormState(): EmployeeFormState {
  return {
    officeId: '',
    firstname: '',
    lastname: '',
    isLoanOfficer: false,
    mobileNo: '',
    joiningDate: toFineractDate(),
    isActive: true
  };
}

function formStateFromInitial(initial?: EmployeeFormInitial): EmployeeFormState {
  if (!initial) {
    return defaultFormState();
  }
  return {
    officeId: initial.officeId ? String(initial.officeId) : '',
    firstname: initial.firstname ?? '',
    lastname: initial.lastname ?? '',
    isLoanOfficer: initial.isLoanOfficer ?? false,
    mobileNo: initial.mobileNo ?? '',
    joiningDate: fineractApiDateToFormString(initial.joiningDate) ?? toFineractDate(),
    isActive: initial.isActive ?? true
  };
}

function employeeFormsEqual(a: EmployeeFormState, b: EmployeeFormState): boolean {
  return (
    a.officeId === b.officeId &&
    a.firstname.trim() === b.firstname.trim() &&
    a.lastname.trim() === b.lastname.trim() &&
    a.isLoanOfficer === b.isLoanOfficer &&
    a.mobileNo.trim() === b.mobileNo.trim() &&
    a.joiningDate === b.joiningDate &&
    a.isActive === b.isActive
  );
}

function toCreatePayload(form: EmployeeFormState): CreateStaffInput {
  return {
    officeId: Number(form.officeId),
    firstname: form.firstname.trim(),
    lastname: form.lastname.trim(),
    isLoanOfficer: form.isLoanOfficer,
    mobileNo: form.mobileNo.trim(),
    joiningDate: form.joiningDate,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

function toUpdatePayload(form: EmployeeFormState): UpdateStaffInput {
  return {
    ...toCreatePayload(form),
    isActive: form.isActive
  };
}

export function EmployeeFormSheet({
  open,
  onOpenChange,
  mode,
  offices,
  staffId,
  initial
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  offices: FineractOfficeOption[];
  staffId?: number;
  initial?: EmployeeFormInitial;
}) {
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<EmployeeFormState>(() => formStateFromInitial(initial));
  const [baseline, setBaseline] = useState<EmployeeFormState | null>(() =>
    mode === 'edit' ? formStateFromInitial(initial) : null
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (next) {
      const nextForm = formStateFromInitial(initial);
      setForm(nextForm);
      setBaseline(mode === 'edit' ? nextForm : null);
      setFieldErrors({});
      setSubmitError(null);
    }
    onOpenChange(next);
  }

  function patchForm(patch: Partial<EmployeeFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  const hasChanges = useMemo(() => {
    if (mode !== 'edit' || baseline == null) {
      return true;
    }
    return !employeeFormsEqual(form, baseline);
  }, [mode, form, baseline]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === 'edit' && !hasChanges) {
      return;
    }
    setSubmitError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createStaffAction(toCreatePayload(form))
          : await updateStaffAction(staffId!, toUpdatePayload(form));

      if (!result.ok) {
        setSubmitError(formatActionErrorMessage(result.message, result.fieldErrors));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      handleOpenChange(false);
      if (mode === 'create' && result.staffId != null) {
        router.push(`/organization/employees/${result.staffId}`);
      } else {
        router.refresh();
      }
    });
  }

  const officeOptions = toSelectOptions(
    offices.map((office) => ({
      id: office.id,
      name: office.nameDecorated ?? office.name
    }))
  );

  const canSubmit =
    form.officeId.trim().length > 0 &&
    form.firstname.trim().length > 0 &&
    form.lastname.trim().length > 0 &&
    form.joiningDate.trim().length > 0;

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === 'create' ? 'Create employee' : 'Edit employee'}
      description={
        mode === 'create'
          ? 'Register a new employee and assign them to a branch.'
          : 'Update employee details and branch assignment.'
      }
      formId={formId}
      submitLabel={mode === 'create' ? 'Create employee' : 'Save changes'}
      submitDisabled={!canSubmit || (mode === 'edit' && !hasChanges)}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-lg"
      error={
        submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null
      }
    >
      <form id={formId} className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <SelectField
          id={`${formId}-officeId`}
          label="Branch"
          required
          value={form.officeId || undefined}
          onValueChange={(value) => patchForm({ officeId: value ?? '' })}
          options={officeOptions}
          placeholder="Select branch"
          error={fieldErrors.officeId}
        />
        <TextField
          id={`${formId}-firstname`}
          label="First name"
          required
          value={form.firstname}
          onChange={(value) => patchForm({ firstname: value })}
          error={fieldErrors.firstname}
          autoComplete="given-name"
        />
        <TextField
          id={`${formId}-lastname`}
          label="Last name"
          required
          value={form.lastname}
          onChange={(value) => patchForm({ lastname: value })}
          error={fieldErrors.lastname}
          autoComplete="family-name"
        />
        <SwitchField
          id={`${formId}-isLoanOfficer`}
          label="Loan officer"
          optional
          className="sm:col-span-2"
          checked={form.isLoanOfficer}
          onCheckedChange={(checked) => patchForm({ isLoanOfficer: checked })}
        />
        <TextField
          id={`${formId}-mobileNo`}
          label="Phone number"
          optional
          value={form.mobileNo}
          onChange={(value) => patchForm({ mobileNo: stripPhoneSpaces(value) })}
          error={fieldErrors.mobileNo}
          autoComplete="tel"
          type="tel"
          placeholder={UGANDA_MOBILE_INTERNATIONAL_PLACEHOLDER}
          hint={UGANDA_PHONE_INTERNATIONAL_HINT}
        />
        <DateField
          id={`${formId}-joiningDate`}
          label="Joining date"
          required
          value={form.joiningDate}
          onChange={(value) => patchForm({ joiningDate: value ?? '' })}
          error={fieldErrors.joiningDate}
        />
        {mode === 'edit' ? (
          <SwitchField
            id={`${formId}-isActive`}
            label="Active"
            optional
            className="sm:col-span-2"
            checked={form.isActive}
            onCheckedChange={(checked) => patchForm({ isActive: checked })}
          />
        ) : null}
      </form>
    </FormSheet>
  );
}

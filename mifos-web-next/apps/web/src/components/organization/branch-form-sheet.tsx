'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractOfficeOption, OfficeBranchProfile } from '@mifos/api-client';
import type { CreateOfficeInput, UpdateOfficeInput } from '@mifos/validation';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, useTransition } from 'react';
import { createOfficeAction, updateOfficeAction } from '@/actions/office';
import { DateField } from '@/components/composites/date-field';
import { FormErrorAlert } from '@/components/composites/form-error-alert';
import { FormSheet } from '@/components/composites/form-sheet';
import { NumericField } from '@/components/composites/numeric-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  BRANCH_REGION_OPTIONS,
  BRANCH_STATUS_OPTIONS,
  BRANCH_TYPE_OPTIONS,
  branchProfileFormFromApi,
  branchProfileInputFromForm,
  defaultBranchProfileFormFields,
  type BranchProfileFormFields
} from '@/lib/fineract/branch-profile-form';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  fineractApiDateToFormString,
  toFineractDate
} from '@/lib/fineract/dates';
import { toSelectOptions } from '@/lib/form/select-options';

type BranchCoreFormState = {
  name: string;
  parentId: string;
  openingDate: string;
  externalId: string;
};

type BranchFormState = BranchCoreFormState & BranchProfileFormFields;

export type BranchFormInitial = {
  name?: string;
  parentId?: number;
  openingDate?: number[] | string;
  externalId?: string;
  branchProfile?: OfficeBranchProfile | null;
};

export type BranchManagerOption = {
  id: number;
  label: string;
};

function defaultFormState(): BranchFormState {
  return {
    name: '',
    parentId: '',
    openingDate: toFineractDate(),
    externalId: '',
    ...defaultBranchProfileFormFields()
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
    externalId: initial.externalId ?? '',
    ...branchProfileFormFromApi(initial.branchProfile)
  };
}

function toCreatePayload(form: BranchFormState): CreateOfficeInput {
  return {
    name: form.name.trim(),
    parentId: Number(form.parentId),
    openingDate: form.openingDate,
    externalId: form.externalId.trim(),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE,
    branchProfile: branchProfileInputFromForm(form)
  };
}

function toUpdatePayload(form: BranchFormState, includeParent: boolean): UpdateOfficeInput {
  const base: UpdateOfficeInput = {
    name: form.name.trim(),
    openingDate: form.openingDate,
    externalId: form.externalId.trim(),
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE,
    branchProfile: branchProfileInputFromForm(form)
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

function BranchFormSection({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-medium">{title}</h3>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function BranchFormSheet({
  open,
  onOpenChange,
  mode,
  parentOptions,
  managerOptions = [],
  officeId,
  initial,
  showParentField = true,
  structuredAccountNumberFormatsEnabled = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  parentOptions: FineractOfficeOption[];
  managerOptions?: BranchManagerOption[];
  officeId?: number;
  initial?: BranchFormInitial;
  showParentField?: boolean;
  structuredAccountNumberFormatsEnabled?: boolean;
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

  const managerSelectOptions = useMemo(
    () => managerOptions.map((option) => ({ value: String(option.id), label: option.label })),
    [managerOptions]
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
      description="Manage all branch details in one place — identity, location, and operations."
      formId={formId}
      submitLabel={mode === 'create' ? 'Create branch' : 'Save changes'}
      submitDisabled={!canSubmit}
      submitLoading={pending}
      className="data-[side=right]:sm:max-w-xl"
      error={submitError ? <FormErrorAlert>{submitError}</FormErrorAlert> : null}
    >
      <form id={formId} className="grid gap-4" onSubmit={handleSubmit}>
        <BranchFormSection title="Identity" />
        <TextField
          id={`${formId}-name`}
          label="Branch name"
          required
          value={form.name}
          onChange={(value) => patchForm({ name: value })}
          error={fieldErrors.name}
        />
        <TextField
          id={`${formId}-officeCode`}
          label="Branch code"
          required={structuredAccountNumberFormatsEnabled}
          optional={!structuredAccountNumberFormatsEnabled}
          value={form.officeCode}
          onChange={(value) => patchForm({ officeCode: value })}
          error={fieldErrors['branchProfile.officeCode'] ?? fieldErrors.officeCode}
          placeholder="e.g. 001"
          hint={
            structuredAccountNumberFormatsEnabled
              ? 'Required for structured account numbers that include a branch code segment.'
              : undefined
          }
        />
        <SelectField
          id={`${formId}-branchType`}
          label="Branch type"
          optional
          value={form.branchType || undefined}
          onValueChange={(value) => patchForm({ branchType: value ?? '' })}
          options={BRANCH_TYPE_OPTIONS.map((value) => ({ value, label: value }))}
          placeholder="Select type"
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
        <SelectField
          id={`${formId}-status`}
          label="Status"
          value={form.status || 'ACTIVE'}
          onValueChange={(value) => patchForm({ status: value ?? 'ACTIVE' })}
          options={BRANCH_STATUS_OPTIONS.map((value) => ({ value, label: value }))}
        />

        <BranchFormSection title="Location & contact" description="Physical address and branch contact details." />
        <TextField
          id={`${formId}-address`}
          label="Address"
          optional
          value={form.address}
          onChange={(value) => patchForm({ address: value })}
          multiline
        />
        <TextField
          id={`${formId}-city`}
          label="City"
          optional
          value={form.city}
          onChange={(value) => patchForm({ city: value })}
        />
        <TextField
          id={`${formId}-countryCode`}
          label="Country code"
          optional
          value={form.countryCode}
          onChange={(value) => patchForm({ countryCode: value })}
          placeholder="e.g. UG"
        />
        <SelectField
          id={`${formId}-regionCode`}
          label="Region"
          optional
          value={form.regionCode || undefined}
          onValueChange={(value) => patchForm({ regionCode: value ?? '' })}
          options={BRANCH_REGION_OPTIONS.map((value) => ({ value, label: value }))}
          placeholder="Select region"
        />
        <TextField
          id={`${formId}-phoneNo`}
          label="Phone"
          optional
          value={form.phoneNo}
          onChange={(value) => patchForm({ phoneNo: value })}
        />
        <TextField
          id={`${formId}-emailAddress`}
          label="Email"
          optional
          type="email"
          value={form.emailAddress}
          onChange={(value) => patchForm({ emailAddress: value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${formId}-latitude`}
            label="Latitude"
            optional
            value={form.latitude}
            onChange={(value) => patchForm({ latitude: value })}
          />
          <TextField
            id={`${formId}-longitude`}
            label="Longitude"
            optional
            value={form.longitude}
            onChange={(value) => patchForm({ longitude: value })}
          />
        </div>

        <BranchFormSection title="Operations" description="Manager, limits, and banking identifiers." />
        {managerSelectOptions.length > 0 ? (
          <SelectField
            id={`${formId}-managerStaffId`}
            label="Branch manager"
            optional
            value={form.managerStaffId || undefined}
            onValueChange={(value) => patchForm({ managerStaffId: value ?? '' })}
            options={managerSelectOptions}
            placeholder="Select manager"
          />
        ) : null}
        <TextField
          id={`${formId}-swiftCode`}
          label="SWIFT / BIC"
          optional
          value={form.swiftCode}
          onChange={(value) => patchForm({ swiftCode: value })}
        />
        <NumericField
          id={`${formId}-cashLimit`}
          label="Cash limit"
          optional
          value={form.cashLimit}
          onChange={(value) => patchForm({ cashLimit: value })}
        />
        <TextField
          id={`${formId}-workingHours`}
          label="Working hours"
          optional
          value={form.workingHours}
          onChange={(value) => patchForm({ workingHours: value })}
          placeholder="e.g. 08:00-17:00"
        />
      </form>
    </FormSheet>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFamilyMemberOptions } from '@mifos/api-client';
import type { FamilyMemberInput } from '@mifos/validation';
import { useId, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { SwitchField } from '@/components/composites/switch-field';
import { TextField } from '@/components/composites/text-field';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import type { FormSubmitResult } from '@/lib/form/submit-result';
import { toSelectOptions } from '@/lib/form/select-options';

function defaultFamilyMemberForm(m?: FamilyMemberInput): FamilyMemberInput {
  return {
    firstName: m?.firstName ?? '',
    middleName: m?.middleName ?? '',
    lastName: m?.lastName ?? '',
    qualification: m?.qualification ?? '',
    relationshipId: m?.relationshipId ?? 0,
    genderId: m?.genderId ?? 0,
    professionId: m?.professionId,
    maritalStatusId: m?.maritalStatusId,
    isDependent: m?.isDependent ?? false,
    dateOfBirth: m?.dateOfBirth,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  };
}

export function FamilyMemberFormSheet({
  open,
  onOpenChange,
  options,
  member,
  onSave,
  submitLoading = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: FineractFamilyMemberOptions | undefined;
  member?: FamilyMemberInput;
  onSave: (member: FamilyMemberInput) => Promise<FormSubmitResult>;
  submitLoading?: boolean;
}) {
  const formId = useId();
  const [form, setForm] = useState<FamilyMemberInput>(() => defaultFamilyMemberForm(member));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (isSubmitting) {
      return;
    }
    if (next) {
      setForm(defaultFamilyMemberForm(member));
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSave() {
    if (isSubmitting) {
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim() || !form.relationshipId || !form.genderId) {
      setError('First name, last name, relationship, and gender are required.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await onSave(form);
      if (result.ok) {
        handleOpenChange(false);
        return;
      }
      setError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={member ? 'Edit next of kin' : 'Add next of kin'}
      description="Optional household or emergency contact details for this client."
      formId={formId}
      submitLabel="Save"
      onSubmit={handleSave}
      submitLoading={isSubmitting || submitLoading}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form
        id={formId}
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
        <TextField
          id="familyFirstName"
          label="First name"
          required
          value={form.firstName}
          onChange={(v) => setForm({ ...form, firstName: v })}
        />
        <TextField
          id="familyMiddleName"
          label="Middle name"
          optional
          value={form.middleName ?? ''}
          onChange={(v) => setForm({ ...form, middleName: v })}
        />
        <TextField
          id="familyLastName"
          label="Last name"
          required
          value={form.lastName}
          onChange={(v) => setForm({ ...form, lastName: v })}
        />
        <TextField
          id="familyQualification"
          label="Qualification"
          optional
          value={form.qualification ?? ''}
          onChange={(v) => setForm({ ...form, qualification: v })}
        />
        <SelectField
          id="familyRelationshipId"
          label="Relationship"
          required
          value={form.relationshipId ? String(form.relationshipId) : undefined}
          onValueChange={(v) => setForm({ ...form, relationshipId: Number(v) })}
          options={toSelectOptions(options?.relationshipIdOptions)}
        />
        <SelectField
          id="familyGenderId"
          label="Gender"
          required
          value={form.genderId ? String(form.genderId) : undefined}
          onValueChange={(v) => setForm({ ...form, genderId: Number(v) })}
          options={toSelectOptions(options?.genderIdOptions)}
        />
        <SelectField
          id="familyProfessionId"
          label="Profession"
          optional
          value={form.professionId ? String(form.professionId) : undefined}
          onValueChange={(v) => setForm({ ...form, professionId: v ? Number(v) : undefined })}
          options={toSelectOptions(options?.professionIdOptions)}
        />
        <SelectField
          id="familyMaritalStatusId"
          label="Marital status"
          optional
          value={form.maritalStatusId ? String(form.maritalStatusId) : undefined}
          onValueChange={(v) => setForm({ ...form, maritalStatusId: v ? Number(v) : undefined })}
          options={toSelectOptions(options?.maritalStatusIdOptions)}
        />
        <DateField
          id="familyDateOfBirth"
          label="Date of birth"
          optional
          value={form.dateOfBirth}
          onChange={(v) => setForm({ ...form, dateOfBirth: v })}
        />
        <SwitchField
          id="familyIsDependent"
          className="sm:col-span-2"
          label="Dependent"
          optional
          checked={form.isDependent ?? false}
          description="Mark if this next of kin contact is financially dependent on the client."
          onCheckedChange={(checked) => setForm({ ...form, isDependent: checked })}
        />
      </form>
    </FormSheet>
  );
}

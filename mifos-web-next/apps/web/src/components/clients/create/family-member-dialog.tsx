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
import { useState } from 'react';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
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

export function FamilyMemberDialog({
  open,
  onOpenChange,
  options,
  member,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: FineractFamilyMemberOptions | undefined;
  member?: FamilyMemberInput;
  onSave: (member: FamilyMemberInput) => void;
}) {
  const [form, setForm] = useState<FamilyMemberInput>(() => defaultFamilyMemberForm(member));
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setForm(defaultFamilyMemberForm(member));
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.relationshipId || !form.genderId) {
      setError('First name, last name, relationship, and gender are required.');
      return;
    }
    setError(null);
    onSave(form);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit family member' : 'Add family member'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {error ? (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          ) : null}
          <TextField
            label="First name"
            required
            value={form.firstName}
            onChange={(v) => setForm({ ...form, firstName: v })}
          />
          <TextField
            label="Middle name"
            optional
            value={form.middleName ?? ''}
            onChange={(v) => setForm({ ...form, middleName: v })}
          />
          <TextField
            label="Last name"
            required
            value={form.lastName}
            onChange={(v) => setForm({ ...form, lastName: v })}
          />
          <TextField
            label="Qualification"
            optional
            value={form.qualification ?? ''}
            onChange={(v) => setForm({ ...form, qualification: v })}
          />
          <SelectField
            label="Relationship"
            required
            value={form.relationshipId ? String(form.relationshipId) : undefined}
            onValueChange={(v) => setForm({ ...form, relationshipId: Number(v) })}
            options={toSelectOptions(options?.relationshipIdOptions)}
          />
          <SelectField
            label="Gender"
            required
            value={form.genderId ? String(form.genderId) : undefined}
            onValueChange={(v) => setForm({ ...form, genderId: Number(v) })}
            options={toSelectOptions(options?.genderIdOptions)}
          />
          <SelectField
            label="Profession"
            optional
            value={form.professionId ? String(form.professionId) : undefined}
            onValueChange={(v) => setForm({ ...form, professionId: v ? Number(v) : undefined })}
            options={toSelectOptions(options?.professionIdOptions)}
          />
          <SelectField
            label="Marital status"
            optional
            value={form.maritalStatusId ? String(form.maritalStatusId) : undefined}
            onValueChange={(v) => setForm({ ...form, maritalStatusId: v ? Number(v) : undefined })}
            options={toSelectOptions(options?.maritalStatusIdOptions)}
          />
          <DateField
            label="Date of birth"
            optional
            value={form.dateOfBirth}
            onChange={(v) => setForm({ ...form, dateOfBirth: v })}
          />
          <Field className="flex flex-row items-center gap-2 self-end">
            <Checkbox
              checked={form.isDependent ?? false}
              onCheckedChange={(c) => setForm({ ...form, isDependent: c === true })}
            />
            <Label className="font-normal">
              Dependent <span className="text-muted-foreground">(optional)</span>
            </Label>
          </Field>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

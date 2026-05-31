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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FINERACT_DATE_FORMAT, FINERACT_LOCALE } from '@/lib/fineract/dates';
import { fineractDateToIso, isoDateToFineract } from '@/lib/fineract/date-input';

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
  const [form, setForm] = useState<FamilyMemberInput>(() => ({
    firstName: member?.firstName ?? '',
    middleName: member?.middleName ?? '',
    lastName: member?.lastName ?? '',
    qualification: member?.qualification ?? '',
    relationshipId: member?.relationshipId ?? 0,
    genderId: member?.genderId ?? 0,
    professionId: member?.professionId,
    maritalStatusId: member?.maritalStatusId,
    isDependent: member?.isDependent ?? false,
    dateOfBirth: member?.dateOfBirth,
    age: member?.age,
    dateFormat: FINERACT_DATE_FORMAT,
    locale: FINERACT_LOCALE
  }));
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.relationshipId || !form.genderId) {
      setError('First name, last name, relationship, and gender are required.');
      return;
    }
    setError(null);
    onSave(form);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit family member' : 'Add family member'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Middle name</Label>
              <Input
                value={form.middleName ?? ''}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input
                value={form.qualification ?? ''}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={form.relationshipId ? String(form.relationshipId) : ''}
                onValueChange={(v) => setForm({ ...form, relationshipId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {options?.relationshipIdOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={form.genderId ? String(form.genderId) : ''}
                onValueChange={(v) => setForm({ ...form, genderId: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {options?.genderIdOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profession</Label>
              <Select
                value={form.professionId ? String(form.professionId) : ''}
                onValueChange={(v) => setForm({ ...form, professionId: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {options?.professionIdOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marital status</Label>
              <Select
                value={form.maritalStatusId ? String(form.maritalStatusId) : ''}
                onValueChange={(v) =>
                  setForm({ ...form, maritalStatusId: v ? Number(v) : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {options?.maritalStatusIdOptions?.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.name ?? opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Input
                type="date"
                value={fineractDateToIso(form.dateOfBirth)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dateOfBirth: e.target.value ? isoDateToFineract(e.target.value) : undefined
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2 self-end">
              <Checkbox
                checked={form.isDependent ?? false}
                onCheckedChange={(c) => setForm({ ...form, isDependent: c === true })}
              />
              <Label>Dependent</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

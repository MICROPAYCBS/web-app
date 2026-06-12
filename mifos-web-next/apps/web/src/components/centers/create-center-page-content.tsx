'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CenterGroupOption, FineractOfficeOption } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  createCenterAction,
  loadCenterGroupsAction,
  loadCenterStaffAction
} from '@/actions/centers';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { centerGeneralPath, CENTERS_LIST_PATH } from '@/lib/fineract/center-paths';
import { toSelectOptions } from '@/lib/form/select-options';

type CreateCenterFormState = {
  name: string;
  officeId: string;
  staffId: string;
  externalId: string;
  submittedOnDate: string;
  active: boolean;
  activationDate: string;
};

function defaultFormState(): CreateCenterFormState {
  return {
    name: '',
    officeId: '',
    staffId: '',
    externalId: '',
    submittedOnDate: '',
    active: false,
    activationDate: ''
  };
}

export function CreateCenterPageContent({ offices }: { offices: FineractOfficeOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CreateCenterFormState>(defaultFormState);
  const [staffOptions, setStaffOptions] = useState<Array<{ id: number; displayName: string }>>([]);
  const [groupOptions, setGroupOptions] = useState<CenterGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [groupMembers, setGroupMembers] = useState<CenterGroupOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingOffice, startOfficeTransition] = useTransition();
  const [pending, startSubmitTransition] = useTransition();

  const officeOptions = useMemo(() => toSelectOptions(offices), [offices]);
  const staffSelectOptions = useMemo(() => toSelectOptions(staffOptions), [staffOptions]);
  const groupSelectOptions = useMemo(() => toSelectOptions(groupOptions), [groupOptions]);

  function handleOfficeChange(officeId: string) {
    setForm((current) => ({
      ...current,
      officeId,
      staffId: ''
    }));
    setStaffOptions([]);
    setGroupOptions([]);
    setSelectedGroupId(undefined);

    if (!officeId) {
      return;
    }

    startOfficeTransition(async () => {
      const [staffResult, groupsResult] = await Promise.all([
        loadCenterStaffAction(officeId),
        loadCenterGroupsAction(officeId)
      ]);
      if (!staffResult.ok) {
        toast.error(staffResult.message);
      } else {
        setStaffOptions(staffResult.data);
      }
      if (!groupsResult.ok) {
        toast.error(groupsResult.message);
      } else {
        setGroupOptions(groupsResult.data);
      }
    });
  }

  function addGroup() {
    const group = groupOptions.find((item) => String(item.id) === selectedGroupId);
    if (!group || groupMembers.some((member) => member.id === group.id)) {
      return;
    }
    setGroupMembers((current) => [...current, group]);
    setSelectedGroupId(undefined);
  }

  function removeGroup(index: number) {
    setGroupMembers((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleSubmit() {
    startSubmitTransition(async () => {
      const result = await createCenterAction({
        name: form.name,
        officeId: Number(form.officeId),
        staffId: form.staffId ? Number(form.staffId) : undefined,
        externalId: form.externalId || undefined,
        submittedOnDate: form.submittedOnDate,
        active: form.active,
        activationDate: form.active ? form.activationDate : undefined,
        groupMembers: groupMembers.map((group) => group.id)
      });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      toast.success('Center created.');
      if (result.centerId != null) {
        router.push(centerGeneralPath(result.centerId));
      } else {
        router.push(CENTERS_LIST_PATH);
      }
    });
  }

  return (
    <ListPage
      title="Create center"
      description="Add a new center and optionally attach groups."
      backLink={<DetailBackLink href={CENTERS_LIST_PATH} label="Back to centers" />}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-4 rounded-lg border border-border p-4">
          <TextField
            id="center-name"
            label="Name"
            required
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            error={fieldErrors.name}
            disabled={pending}
          />
          <SelectField
            id="center-office"
            label="Branch"
            required
            value={form.officeId || undefined}
            onValueChange={(value) => handleOfficeChange(value ?? '')}
            options={officeOptions}
            placeholder="Select branch"
            disabled={pending || loadingOffice}
            error={fieldErrors.officeId}
          />
          <SelectField
            id="center-staff"
            label="Staff"
            value={form.staffId || undefined}
            onValueChange={(value) => setForm((current) => ({ ...current, staffId: value ?? '' }))}
            options={staffSelectOptions}
            placeholder="Select staff"
            disabled={!form.officeId || pending || loadingOffice}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="center-active"
              checked={form.active}
              onCheckedChange={(value) =>
                setForm((current) => ({ ...current, active: value === true }))
              }
              disabled={pending}
            />
            <Label htmlFor="center-active">Active</Label>
          </div>
          {form.active ? (
            <TextField
              id="center-activation-date"
              label="Activation date"
              type="date"
              required
              value={form.activationDate}
              onChange={(value) => setForm((current) => ({ ...current, activationDate: value }))}
              error={fieldErrors.activationDate}
              disabled={pending}
            />
          ) : null}
          <TextField
            id="center-external-id"
            label="External ID"
            value={form.externalId}
            onChange={(value) => setForm((current) => ({ ...current, externalId: value }))}
            disabled={pending}
          />
          <TextField
            id="center-submitted-on"
            label="Submitted on"
            type="date"
            required
            value={form.submittedOnDate}
            onChange={(value) => setForm((current) => ({ ...current, submittedOnDate: value }))}
            error={fieldErrors.submittedOnDate}
            disabled={pending}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <SelectField
                id="center-group-choice"
                label="Select and add groups"
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
                options={groupSelectOptions}
                placeholder="Select group"
                disabled={!form.officeId || groupOptions.length === 0 || pending || loadingOffice}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedGroupId || pending}
              onClick={addGroup}
            >
              <Plus className="mr-2 size-4" />
              Add group
            </Button>
          </div>
          {groupMembers.length ? (
            <ul className="space-y-2">
              {groupMembers.map((group, index) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{group.name}</div>
                    {group.officeName ? (
                      <div className="text-sm text-muted-foreground">{group.officeName}</div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${group.name}`}
                    onClick={() => removeGroup(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push(CENTERS_LIST_PATH)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </ListPage>
  );
}

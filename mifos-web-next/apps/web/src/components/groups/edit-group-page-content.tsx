'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupEditTemplate } from '@mifos/api-client';
import { formatActionErrorMessage } from '@mifos/validation';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateGroupAction } from '@/actions/groups';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import { groupGeneralPath } from '@/lib/fineract/group-paths';
import { toSelectOptions } from '@/lib/form/select-options';

function toDateInputValue(value: string | number[] | undefined): string {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return '';
}

export function EditGroupPageContent({ group }: { group: GroupEditTemplate }) {
  const router = useRouter();
  const [name, setName] = useState(group.name);
  const [staffId, setStaffId] = useState(group.staffId != null ? String(group.staffId) : '');
  const [externalId, setExternalId] = useState(group.externalId ?? '');
  const [activationDate, setActivationDate] = useState(
    toDateInputValue(group.activationDate ?? group.timeline?.activationDate)
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const staffOptions = useMemo(() => toSelectOptions(group.staffOptions), [group.staffOptions]);
  const isPendingStatus = group.status?.value === 'Pending';

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateGroupAction(group.id, {
        name,
        staffId: staffId ? Number(staffId) : undefined,
        externalId,
        activationDate: isPendingStatus ? activationDate : undefined
      });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(formatActionErrorMessage(result.message, result.fieldErrors));
        return;
      }
      toast.success('Group updated.');
      router.push(groupGeneralPath(group.id));
      router.refresh();
    });
  }

  return (
    <ListPage
      title="Edit group"
      description={group.name}
      backLink={<DetailBackLink href={groupGeneralPath(group.id)} label="Back to group" />}
    >
      <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-border p-4">
        <TextField
          id="edit-group-name"
          label="Name"
          required
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          disabled={pending}
        />
        <SelectField
          id="edit-group-staff"
          label="Staff"
          value={staffId || undefined}
          onValueChange={(value) => setStaffId(value ?? '')}
          options={staffOptions}
          placeholder="Select staff"
          disabled={pending}
        />
        <TextField
          id="edit-group-external-id"
          label="External ID"
          value={externalId}
          onChange={setExternalId}
          disabled={pending}
        />
        {isPendingStatus ? (
          <TextField
            id="edit-group-activation-date"
            label="Activation date"
            type="date"
            required
            value={activationDate}
            onChange={setActivationDate}
            error={fieldErrors.activationDate}
            disabled={pending}
          />
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => router.push(groupGeneralPath(group.id))}
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

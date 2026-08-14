'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { GroupClientOption, FineractOfficeOption } from '@mifos/api-client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError, toastActionError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import {
  createGroupAction,
  loadGroupStaffAction,
  searchGroupClientsAction
} from '@/actions/groups';
import { DetailBackLink } from '@/components/composites';
import { TransactionDateField } from '@/components/composites/transaction-date-field';
import { ListPage } from '@/components/composites/list-page';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { useInitialTransactionDate } from '@/components/platform/business-date-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { groupGeneralPath, GROUPS_LIST_PATH } from '@/lib/fineract/group-paths';
import { toSelectOptions } from '@/lib/form/select-options';

type CreateGroupFormState = {
  name: string;
  officeId: string;
  staffId: string;
  externalId: string;
  submittedOnDate: string;
  active: boolean;
  activationDate: string;
};

function defaultFormState(initialDate: string): CreateGroupFormState {
  return {
    name: '',
    officeId: '',
    staffId: '',
    externalId: '',
    submittedOnDate: initialDate,
    active: false,
    activationDate: initialDate
  };
}

const CLIENT_SEARCH_DEBOUNCE_MS = 400;

export function CreateGroupPageContent({ offices }: { offices: FineractOfficeOption[] }) {
  const router = useRouter();
  const initialDate = useInitialTransactionDate();
  const [form, setForm] = useState<CreateGroupFormState>(() => defaultFormState(initialDate));
  const [staffOptions, setStaffOptions] = useState<Array<{ id: number; displayName: string }>>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [debouncedClientSearch, setDebouncedClientSearch] = useState('');
  const [clientOptions, setClientOptions] = useState<GroupClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [clientMembers, setClientMembers] = useState<GroupClientOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadingOffice, startOfficeTransition] = useTransition();
  const [loadingClients, startClientTransition] = useTransition();
  const [pending, startSubmitTransition] = useTransition();

  const officeOptions = useMemo(() => toSelectOptions(offices), [offices]);
  const staffSelectOptions = useMemo(() => toSelectOptions(staffOptions), [staffOptions]);
  const clientSelectOptions = useMemo(() => toSelectOptions(clientOptions), [clientOptions]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedClientSearch(clientSearch), CLIENT_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    if (!form.officeId || debouncedClientSearch.trim().length < 2) {
      setClientOptions([]);
      return;
    }
    startClientTransition(async () => {
      const result = await searchGroupClientsAction(form.officeId, debouncedClientSearch);
      if (!result.ok) {
        toastFineractError(result.message);
        return;
      }
      setClientOptions(result.data);
    });
  }, [form.officeId, debouncedClientSearch]);

  function handleOfficeChange(officeId: string) {
    setForm((current) => ({
      ...current,
      officeId,
      staffId: ''
    }));
    setStaffOptions([]);
    setClientOptions([]);
    setClientSearch('');
    setSelectedClientId(undefined);

    if (!officeId) {
      return;
    }

    startOfficeTransition(async () => {
      const staffResult = await loadGroupStaffAction(officeId);
      if (!staffResult.ok) {
        toastFineractError(staffResult.message);
      } else {
        setStaffOptions(staffResult.data);
      }
    });
  }

  function addClient() {
    const client = clientOptions.find((item) => String(item.id) === selectedClientId);
    if (!client || clientMembers.some((member) => member.id === client.id)) {
      return;
    }
    setClientMembers((current) => [...current, client]);
    setSelectedClientId(undefined);
    setClientSearch('');
  }

  function removeClient(index: number) {
    setClientMembers((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleSubmit() {
    startSubmitTransition(async () => {
      const result = await createGroupAction({
        name: form.name,
        officeId: Number(form.officeId),
        staffId: form.staffId ? Number(form.staffId) : undefined,
        externalId: form.externalId || undefined,
        submittedOnDate: form.submittedOnDate,
        active: form.active,
        activationDate: form.active ? form.activationDate : undefined,
        clientMembers: clientMembers.map((client) => client.id)
      });
      if (!toastCommandOutcome(result, {
        completed: 'Group created.',
        pending: 'Group creation sent for approval.'
      })) {
        setFieldErrors(result.fieldErrors ?? {});
        toastActionError(result.message, result.fieldErrors);
        return;
      }
      if (result.groupId != null) {
        router.push(groupGeneralPath(result.groupId));
      } else {
        router.push(GROUPS_LIST_PATH);
      }
    });
  }

  return (
    <ListPage
      title="Create group"
      description="Add a new group and optionally attach customers."
      backLink={<DetailBackLink href={GROUPS_LIST_PATH} label="Back to groups" />}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-4 rounded-lg border border-border p-4">
          <TextField
            id="group-name"
            label="Name"
            required
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            error={fieldErrors.name}
            disabled={pending}
          />
          <SelectField
            id="group-office"
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
            id="group-staff"
            label="Staff"
            value={form.staffId || undefined}
            onValueChange={(value) => setForm((current) => ({ ...current, staffId: value ?? '' }))}
            options={staffSelectOptions}
            placeholder="Select staff"
            disabled={!form.officeId || pending || loadingOffice}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="group-active"
              checked={form.active}
              onCheckedChange={(value) =>
                setForm((current) => ({
                  ...current,
                  active: value === true,
                  activationDate:
                    value === true && !current.activationDate.trim()
                      ? current.submittedOnDate || initialDate
                      : current.activationDate
                }))
              }
              disabled={pending}
            />
            <Label htmlFor="group-active">Active</Label>
          </div>
          {form.active ? (
            <TransactionDateField
              id="group-activation-date"
              label="Activation date"
              required
              value={form.activationDate}
              onChange={(value) => setForm((current) => ({ ...current, activationDate: value }))}
              error={fieldErrors.activationDate}
              disabled={pending}
            />
          ) : null}
          <TextField
            id="group-external-id"
            label="External ID"
            value={form.externalId}
            onChange={(value) => setForm((current) => ({ ...current, externalId: value }))}
            disabled={pending}
          />
          <TransactionDateField
            id="group-submitted-on"
            label="Submitted on"
            required
            value={form.submittedOnDate}
            onChange={(value) => setForm((current) => ({ ...current, submittedOnDate: value }))}
            error={fieldErrors.submittedOnDate}
            disabled={pending}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <TextField
            id="group-client-search"
            label="Search customers to add"
            value={clientSearch}
            onChange={setClientSearch}
            placeholder="Type at least 2 characters"
            disabled={!form.officeId || pending || loadingOffice}
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <SelectField
                id="group-client-choice"
                label="Select and add customers"
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                options={clientSelectOptions}
                placeholder={loadingClients ? 'Searching…' : 'Select customer'}
                disabled={
                  !form.officeId ||
                  clientSelectOptions.length === 0 ||
                  pending ||
                  loadingOffice ||
                  loadingClients
                }
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedClientId || pending}
              onClick={addClient}
            >
              <Plus className="mr-2 size-4" />
              Add customer
            </Button>
          </div>
          {clientMembers.length ? (
            <ul className="space-y-2">
              {clientMembers.map((client, index) => (
                <li
                  key={client.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{client.displayName}</div>
                    {client.accountNo ? (
                      <div className="text-sm text-muted-foreground">{client.accountNo}</div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${client.displayName}`}
                    onClick={() => removeClient(index)}
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
            onClick={() => router.push(GROUPS_LIST_PATH)}
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

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionTemplate } from '@mifos/api-client';
import { useId } from 'react';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { sanitizeNumericInput } from '@/components/composites/numeric-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { fineractDateToDate, todayStart } from '@/lib/fineract/date-input';
import { standingInstructionEnumLabel } from '@/lib/fineract/standing-instruction-display';

export type StandingInstructionHistorySearchForm = {
  clientName: string;
  clientId: string;
  transferType: string;
  fromAccountType: string;
  fromAccountId: string;
  fromDate: string;
  toDate: string;
};

export const EMPTY_STANDING_INSTRUCTION_HISTORY_SEARCH: StandingInstructionHistorySearchForm = {
  clientName: '',
  clientId: '',
  transferType: '',
  fromAccountType: '',
  fromAccountId: '',
  fromDate: '',
  toDate: ''
};

export function StandingInstructionHistoryParameterSheet({
  open,
  onOpenChange,
  template,
  form,
  onFormChange,
  pending = false,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: StandingInstructionTemplate;
  form: StandingInstructionHistorySearchForm;
  onFormChange: (
    key: keyof StandingInstructionHistorySearchForm,
    value: StandingInstructionHistorySearchForm[keyof StandingInstructionHistorySearchForm]
  ) => void;
  pending?: boolean;
  onSubmit: () => void;
}) {
  const formId = useId();

  function updateForm<K extends keyof StandingInstructionHistorySearchForm>(
    key: K,
    value: StandingInstructionHistorySearchForm[K]
  ) {
    if (key === 'fromAccountType' && !value) {
      onFormChange('fromAccountId', '');
    }
    onFormChange(key, value);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Search parameters"
      description="Filter standing instruction execution history. All fields are optional."
      formId={formId}
      cancelLabel="Close"
      submitLabel={pending ? 'Searching…' : 'Search instructions'}
      submitLoading={pending}
      submitDisabled={pending}
      onSubmit={onSubmit}
      className="data-[side=right]:sm:max-w-lg"
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="si-client-name">Customer name</Label>
          <Input
            id="si-client-name"
            value={form.clientName}
            onChange={(event) => updateForm('clientName', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="si-client-id">Customer ID</Label>
          <Input
            id="si-client-id"
            inputMode="numeric"
            value={form.clientId}
            onChange={(event) =>
              updateForm('clientId', sanitizeNumericInput(event.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="si-transfer-type">Transfer type</Label>
          <Select
            value={form.transferType || undefined}
            onValueChange={(value) => updateForm('transferType', value ?? '')}
          >
            <SelectTrigger id="si-transfer-type" className="w-full">
              <SelectValue placeholder="Any transfer type" />
            </SelectTrigger>
            <SelectContent>
              {(template.transferTypeOptions ?? []).map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {standingInstructionEnumLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="si-account-type">Account type</Label>
          <Select
            value={form.fromAccountType || undefined}
            onValueChange={(value) => updateForm('fromAccountType', value ?? '')}
          >
            <SelectTrigger id="si-account-type" className="w-full">
              <SelectValue placeholder="Any account type" />
            </SelectTrigger>
            <SelectContent>
              {(template.fromAccountTypeOptions ?? []).map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {standingInstructionEnumLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.fromAccountType ? (
          <div className="space-y-2">
            <Label htmlFor="si-from-account-id">From account ID</Label>
            <Input
              id="si-from-account-id"
              inputMode="numeric"
              value={form.fromAccountId}
              onChange={(event) =>
                updateForm('fromAccountId', sanitizeNumericInput(event.target.value))
              }
            />
          </div>
        ) : null}
        <DateField
          id="si-from-date"
          label="From date"
          value={form.fromDate}
          onChange={(value) => updateForm('fromDate', value ?? '')}
          toDate={form.toDate ? fineractDateToDate(form.toDate) : todayStart()}
        />
        <DateField
          id="si-to-date"
          label="To date"
          value={form.toDate}
          onChange={(value) => updateForm('toDate', value ?? '')}
          toDate={todayStart()}
        />
      </form>
    </FormSheet>
  );
}

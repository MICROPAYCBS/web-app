'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { StandingInstructionTemplate } from '@mifos/api-client';
import { useId, useMemo } from 'react';
import { DateField } from '@/components/composites/date-field';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { sanitizeNumericInput } from '@/components/composites/numeric-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fineractDateToDate, todayStart } from '@/lib/fineract/date-input';
import { standingInstructionEnumSelectOptions } from '@/lib/fineract/standing-instruction-display';

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
  const transferTypeOptions = useMemo(
    () => standingInstructionEnumSelectOptions(template.transferTypeOptions),
    [template.transferTypeOptions]
  );
  const fromAccountTypeOptions = useMemo(
    () => standingInstructionEnumSelectOptions(template.fromAccountTypeOptions),
    [template.fromAccountTypeOptions]
  );

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
        <SelectField
          id="si-transfer-type"
          label="Transfer type"
          optional
          value={form.transferType}
          onValueChange={(value) => updateForm('transferType', value ?? '')}
          options={transferTypeOptions}
          placeholder="Any transfer type"
        />
        <SelectField
          id="si-account-type"
          label="Account type"
          optional
          value={form.fromAccountType}
          onValueChange={(value) => updateForm('fromAccountType', value ?? '')}
          options={fromAccountTypeOptions}
          placeholder="Any account type"
        />
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

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  FineractCurrencyOption,
  FineractJournalEntryGlAccountOption,
  FineractOfficeOption
} from '@mifos/api-client';
import { ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { DateField } from '@/components/composites/date-field';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  currencySelectOptions,
  formatJournalEntryGlAccountLabel
} from '@/lib/accounting/journal-entry-display';
import type { Department } from '@/lib/fineract/departments';
import type { JournalEntrySearchFilters } from '@/lib/fineract/journal-entry-query';
import { JOURNAL_ENTRIES_CREATED_BY_ALL } from '@/lib/fineract/journal-entry-query';

const ENTRY_TYPE_OPTIONS = [
  { value: '', label: 'All entries' },
  { value: 'true', label: 'Manual entries' }
];

function createdByOptions(currentUserId: string) {
  return [
    { value: currentUserId, label: 'My entries' },
    { value: JOURNAL_ENTRIES_CREATED_BY_ALL, label: 'Everyone' }
  ];
}

export function JournalEntriesFilterFields({
  draft,
  onDraftChange,
  offices,
  glAccounts,
  departments,
  currencies = [],
  currentUserId,
  pending = false
}: {
  draft: JournalEntrySearchFilters;
  onDraftChange: (draft: JournalEntrySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies?: FineractCurrencyOption[];
  currentUserId: string;
  pending?: boolean;
}) {
  function patchDraft(patch: Partial<JournalEntrySearchFilters>) {
    onDraftChange({ ...draft, ...patch });
  }

  const currencyOptions = currencySelectOptions(currencies);

  return (
    <div className="space-y-4">
      <SelectField
        label="Currency"
        value={draft.currencyCode || currencyOptions[0]?.value || ''}
        onValueChange={(value) => patchDraft({ currencyCode: value || undefined })}
        options={currencyOptions}
        placeholder="Select currency"
        disabled={pending || currencyOptions.length === 0}
      />
      <SelectField
        label="Created by"
        value={draft.createdByUserId || currentUserId}
        onValueChange={(value) =>
          patchDraft({ createdByUserId: value || currentUserId })
        }
        options={createdByOptions(currentUserId)}
        disabled={pending}
      />
      <SelectField
        label="Branch"
        optional
        value={draft.officeId}
        onValueChange={(value) => patchDraft({ officeId: value })}
        options={offices.map((office) => ({
          value: String(office.id),
          label: office.name ?? office.nameDecorated ?? String(office.id)
        }))}
        placeholder="All branches"
        disabled={pending}
      />
      <SelectField
        label="GL account"
        optional
        value={draft.glAccountId}
        onValueChange={(value) => patchDraft({ glAccountId: value })}
        options={glAccounts.map((account) => ({
          value: String(account.id),
          label: formatJournalEntryGlAccountLabel(account),
          keywords: [account.glCode, account.name]
        }))}
        placeholder="All accounts"
        disabled={pending}
      />
      <SelectField
        label="Department"
        optional
        value={draft.departmentId}
        onValueChange={(value) => patchDraft({ departmentId: value })}
        options={departments
          .filter((department) => department.active !== false)
          .filter(
            (department) =>
              !draft.officeId ||
              department.officeId == null ||
              String(department.officeId) === draft.officeId
          )
          .map((department) => ({
            value: String(department.id),
            label: department.departmentName,
            keywords: [department.departmentCode]
          }))}
        placeholder="All departments"
        disabled={pending}
      />
      <SelectField
        label="Entry type"
        optional
        value={draft.manualEntriesOnly ?? ''}
        onValueChange={(value) => patchDraft({ manualEntriesOnly: value ?? '' })}
        options={ENTRY_TYPE_OPTIONS}
        disabled={pending}
      />
      <DateField
        label="Transaction date from"
        value={draft.fromDate}
        onChange={(value) => patchDraft({ fromDate: value })}
        disabled={pending}
      />
      <DateField
        label="Transaction date to"
        value={draft.toDate}
        onChange={(value) => patchDraft({ toDate: value })}
        disabled={pending}
      />
      <TextField
        label="Transaction ID"
        optional
        value={draft.transactionId ?? ''}
        onChange={(value) => patchDraft({ transactionId: value })}
        disabled={pending}
      />
      <DateField
        label="Submitted on from"
        optional
        value={draft.submittedOnDateFrom}
        onChange={(value) => patchDraft({ submittedOnDateFrom: value })}
        disabled={pending}
      />
      <DateField
        label="Submitted on to"
        optional
        value={draft.submittedOnDateTo}
        onChange={(value) => patchDraft({ submittedOnDateTo: value })}
        disabled={pending}
      />
    </div>
  );
}

export function JournalEntriesFilterSidebar({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  offices,
  glAccounts,
  departments,
  currencies = [],
  currentUserId,
  pending = false,
  onApply,
  onClear
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: JournalEntrySearchFilters;
  onDraftChange: (draft: JournalEntrySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies?: FineractCurrencyOption[];
  currentUserId: string;
  pending?: boolean;
  onApply: (filters: JournalEntrySearchFilters) => void;
  onClear: () => void;
}) {
  function handleApply() {
    onApply(draft);
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter journal entries"
      description="By default only your entries are shown. Switch Created by to Everyone to see all."
      applyLabel={pending ? 'Searching…' : 'Search'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
    >
      <JournalEntriesFilterFields
        draft={draft}
        onDraftChange={onDraftChange}
        offices={offices}
        glAccounts={glAccounts}
        departments={departments}
        currencies={currencies}
        currentUserId={currentUserId}
        pending={pending}
      />
    </ListFilterSheet>
  );
}

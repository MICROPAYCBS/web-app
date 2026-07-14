'use client';

/**
 * Copyright since 2026 MicroPay
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
import type { GlAccountEnquirySearchFilters } from '@/lib/fineract/gl-account-enquiry-query';

const ENTRY_TYPE_OPTIONS = [
  { value: '', label: 'All entries' },
  { value: 'true', label: 'Manual entries' }
];

export function GlAccountEnquiryFilterFields({
  draft,
  onDraftChange,
  offices,
  glAccounts,
  departments,
  currencies,
  pending = false
}: {
  draft: GlAccountEnquirySearchFilters;
  onDraftChange: (draft: GlAccountEnquirySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
  pending?: boolean;
}) {
  function patchDraft(patch: Partial<GlAccountEnquirySearchFilters>) {
    onDraftChange({ ...draft, ...patch });
  }

  return (
    <div className="space-y-4">
      <SelectField
        label="GL account"
        required
        value={draft.glAccountId}
        onValueChange={(value) => patchDraft({ glAccountId: value })}
        options={glAccounts.map((account) => ({
          value: String(account.id),
          label: formatJournalEntryGlAccountLabel(account),
          keywords: [account.glCode, account.name]
        }))}
        placeholder="Select an account"
        disabled={pending}
      />
      <SelectField
        label="Currency"
        required
        value={draft.currencyCode || undefined}
        onValueChange={(value) => patchDraft({ currencyCode: value ?? '' })}
        options={currencySelectOptions(currencies)}
        placeholder="Select currency"
        disabled={pending || currencies.length === 0}
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

export function GlAccountEnquiryFilterSidebar({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  offices,
  glAccounts,
  departments,
  currencies,
  pending = false,
  onApply,
  onClear
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: GlAccountEnquirySearchFilters;
  onDraftChange: (draft: GlAccountEnquirySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
  pending?: boolean;
  onApply: (filters: GlAccountEnquirySearchFilters) => void;
  onClear: () => void;
}) {
  const canApply = Boolean(draft.glAccountId?.trim() && draft.currencyCode?.trim());

  function handleApply() {
    if (!canApply) {
      return;
    }
    onApply(draft);
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="GL account enquiry"
      description="Select a GL account, currency, and optional filters. Running balances reflect the selected branch scope."
      applyLabel={pending ? 'Searching…' : 'Search'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
      disabled={!canApply}
    >
      <GlAccountEnquiryFilterFields
        draft={draft}
        onDraftChange={onDraftChange}
        offices={offices}
        glAccounts={glAccounts}
        departments={departments}
        currencies={currencies}
        pending={pending}
      />
    </ListFilterSheet>
  );
}

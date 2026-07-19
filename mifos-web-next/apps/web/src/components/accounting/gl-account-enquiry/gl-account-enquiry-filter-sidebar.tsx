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
import {
  currencySelectOptions,
  formatJournalEntryGlAccountLabel
} from '@/lib/accounting/journal-entry-display';
import type { Department } from '@/lib/fineract/departments';
import type { GlAccountEnquirySearchFilters } from '@/lib/fineract/gl-account-enquiry-query';

export function GlAccountEnquiryFilterFields({
  draft,
  onDraftChange,
  offices,
  glAccounts = [],
  departments,
  currencies,
  pending = false,
  hideGlAccount = false
}: {
  draft: GlAccountEnquirySearchFilters;
  onDraftChange: (draft: GlAccountEnquirySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts?: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
  pending?: boolean;
  /** When true, GL account is locked on the detail History tab. */
  hideGlAccount?: boolean;
}) {
  function patchDraft(patch: Partial<GlAccountEnquirySearchFilters>) {
    onDraftChange({ ...draft, ...patch });
  }

  return (
    <div className="space-y-4">
      {!hideGlAccount ? (
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
      ) : null}
      <SelectField
        label="Branch"
        required
        value={draft.officeId || undefined}
        onValueChange={(value) => patchDraft({ officeId: value ?? '' })}
        options={offices.map((office) => ({
          value: String(office.id),
          label: office.name ?? office.nameDecorated ?? String(office.id)
        }))}
        placeholder="Select a branch"
        disabled={pending}
      />
      <SelectField
        label="Department"
        value={draft.departmentId || undefined}
        onValueChange={(value) => patchDraft({ departmentId: value === 'all' ? '' : value })}
        options={[
          { value: 'all', label: 'All departments' },
          ...departments.map((department) => ({
            value: String(department.id),
            label: department.departmentName,
            keywords: [department.departmentCode, department.officeName ?? '']
          }))
        ]}
        placeholder="All departments"
        disabled={pending || departments.length === 0}
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
    </div>
  );
}

export function GlAccountEnquiryFilterSidebar({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  offices,
  glAccounts = [],
  departments,
  currencies,
  pending = false,
  lockedGlAccountId,
  onApply,
  onClear
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: GlAccountEnquirySearchFilters;
  onDraftChange: (draft: GlAccountEnquirySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts?: FineractJournalEntryGlAccountOption[];
  departments: Department[];
  currencies: FineractCurrencyOption[];
  pending?: boolean;
  /** When set, hides the GL account picker and locks the account id. */
  lockedGlAccountId?: string;
  onApply: (filters: GlAccountEnquirySearchFilters) => void;
  onClear: () => void;
}) {
  const hideGlAccount = Boolean(lockedGlAccountId);
  const canApply = Boolean(
    (hideGlAccount || draft.glAccountId?.trim()) &&
      draft.currencyCode?.trim() &&
      draft.officeId?.trim()
  );

  function handleApply() {
    if (!canApply) {
      return;
    }
    onApply(
      lockedGlAccountId
        ? { ...draft, glAccountId: lockedGlAccountId }
        : draft
    );
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title={hideGlAccount ? 'Account history' : 'GL account enquiry'}
      description={
        hideGlAccount
          ? 'Select a branch, currency, and date range. Balances use the ledger snapshot plus period activity.'
          : 'Select a GL account, branch, currency, and date range. Balances use the ledger snapshot plus period activity.'
      }
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
        hideGlAccount={hideGlAccount}
      />
    </ListFilterSheet>
  );
}

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
import type { GlAccountEnquirySearchFilters } from '@/lib/fineract/gl-account-enquiry-query';

export function GlAccountEnquiryFilterFields({
  draft,
  onDraftChange,
  offices,
  glAccounts,
  currencies,
  pending = false
}: {
  draft: GlAccountEnquirySearchFilters;
  onDraftChange: (draft: GlAccountEnquirySearchFilters) => void;
  offices: FineractOfficeOption[];
  glAccounts: FineractJournalEntryGlAccountOption[];
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
  glAccounts,
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
  currencies: FineractCurrencyOption[];
  pending?: boolean;
  onApply: (filters: GlAccountEnquirySearchFilters) => void;
  onClear: () => void;
}) {
  const canApply = Boolean(
    draft.glAccountId?.trim() && draft.currencyCode?.trim() && draft.officeId?.trim()
  );

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
      description="Select a GL account, branch, currency, and date range. Balances use the ledger snapshot plus period activity."
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
        currencies={currencies}
        pending={pending}
      />
    </ListFilterSheet>
  );
}

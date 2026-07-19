'use client';

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption, FineractOfficeOption } from '@mifos/api-client';
import { useEffect, useState } from 'react';
import { ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { currencySelectOptions } from '@/lib/accounting/journal-entry-display';
import {
  ADVANCED_GL_ACCOUNT_ENQUIRY_STATUS_OPTIONS,
  countActiveAdvancedGlAccountEnquiryFilters,
  type AdvancedGlAccountEnquirySearchFilters
} from '@/lib/fineract/advanced-gl-account-enquiry-query';

export function AdvancedGlAccountEnquiryFilterFields({
  draft,
  onDraftChange,
  offices,
  currencies,
  pending = false
}: {
  draft: AdvancedGlAccountEnquirySearchFilters;
  onDraftChange: (draft: AdvancedGlAccountEnquirySearchFilters) => void;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  pending?: boolean;
}) {
  function patchDraft(patch: Partial<AdvancedGlAccountEnquirySearchFilters>) {
    onDraftChange({ ...draft, ...patch });
  }

  return (
    <div className="space-y-4">
      <TextField
        label="GL prefix"
        optional
        value={draft.glPrefix}
        onChange={(value) => patchDraft({ glPrefix: value })}
        placeholder="e.g. 1"
        disabled={pending}
      />
      <TextField
        label="Ledger number"
        optional
        value={draft.ledgerNumber}
        onChange={(value) => patchDraft({ ledgerNumber: value })}
        placeholder="GL code or partial code"
        disabled={pending}
      />
      <SelectField
        label="Branch"
        optional
        value={draft.officeId || ''}
        onValueChange={(value) => patchDraft({ officeId: value ?? '' })}
        options={[
          { value: '', label: 'Any branch' },
          ...offices.map((office) => ({
            value: String(office.id),
            label: office.name ?? office.nameDecorated ?? String(office.id)
          }))
        ]}
        placeholder="Any branch"
        disabled={pending}
      />
      <SelectField
        label="Currency"
        optional
        value={draft.currencyCode || ''}
        onValueChange={(value) => patchDraft({ currencyCode: value ?? '' })}
        options={[
          { value: '', label: 'Any currency' },
          ...currencySelectOptions(currencies)
        ]}
        placeholder="Any currency"
        disabled={pending || currencies.length === 0}
      />
      <SelectField
        label="Status"
        optional
        value={draft.status || ''}
        onValueChange={(value) =>
          patchDraft({
            status: value === 'enabled' || value === 'disabled' ? value : ''
          })
        }
        options={[
          { value: '', label: 'Any status' },
          ...ADVANCED_GL_ACCOUNT_ENQUIRY_STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label
          }))
        ]}
        placeholder="Any status"
        disabled={pending}
      />
    </div>
  );
}

export function AdvancedGlAccountEnquiryFilterSidebar({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  offices,
  currencies,
  pending = false,
  onApply,
  onClear
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: AdvancedGlAccountEnquirySearchFilters;
  onDraftChange: (draft: AdvancedGlAccountEnquirySearchFilters) => void;
  offices: FineractOfficeOption[];
  currencies: FineractCurrencyOption[];
  pending?: boolean;
  onApply: (filters: AdvancedGlAccountEnquirySearchFilters) => void;
  onClear: () => void;
}) {
  const [filterHint, setFilterHint] = useState<string | null>(null);
  const activeCount = countActiveAdvancedGlAccountEnquiryFilters(draft);

  useEffect(() => {
    if (activeCount > 0) {
      setFilterHint(null);
    }
  }, [activeCount]);

  function handleApply(): boolean {
    if (activeCount === 0) {
      setFilterHint('Specify at least one filter to search.');
      return false;
    }
    setFilterHint(null);
    onApply(draft);
    return true;
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="GL account enquiry"
      description="All filters are optional — specify at least one to search."
      applyLabel={pending ? 'Searching…' : 'Search'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
    >
      <AdvancedGlAccountEnquiryFilterFields
        draft={draft}
        onDraftChange={onDraftChange}
        offices={offices}
        currencies={currencies}
        pending={pending}
      />
      {filterHint ? (
        <p className="text-sm text-destructive" role="alert">
          {filterHint}
        </p>
      ) : null}
    </ListFilterSheet>
  );
}

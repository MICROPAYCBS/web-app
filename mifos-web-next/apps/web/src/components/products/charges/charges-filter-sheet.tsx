'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ChargeTemplate } from '@mifos/api-client';
import { useMemo } from 'react';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import type { ChargeListFilters } from '@/lib/fineract/charge-list-query';
import { fineractOptionLabel } from '@/lib/form/select-options';

export function ChargesFilterFields({
  draft,
  onDraftChange,
  appliesToOptions,
  disabled = false
}: {
  draft: ChargeListFilters;
  onDraftChange: (draft: ChargeListFilters) => void;
  appliesToOptions: ChargeTemplate['chargeAppliesToOptions'];
  disabled?: boolean;
}) {
  const appliesToSelectOptions = useMemo(
    () =>
      (appliesToOptions ?? []).map((option) => ({
        value: String(option.id),
        label: fineractOptionLabel(option)
      })),
    [appliesToOptions]
  );

  return (
    <ListFilterSection title="Product type">
      <SelectField
        id="charges-applies-to"
        label="Applies to"
        optional
        value={draft.appliesTo}
        onValueChange={(value) => onDraftChange({ appliesTo: value ?? undefined })}
        options={appliesToSelectOptions}
        placeholder="All product types"
        disabled={disabled}
      />
    </ListFilterSection>
  );
}

export function ChargesFilterSheet({
  open,
  onOpenChange,
  appliesToOptions,
  draft,
  onDraftChange,
  onApply,
  onClear,
  pending = false,
  disabled = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliesToOptions: ChargeTemplate['chargeAppliesToOptions'];
  draft: ChargeListFilters;
  onDraftChange: (draft: ChargeListFilters) => void;
  onApply: (filters: ChargeListFilters) => void;
  onClear: () => void;
  pending?: boolean;
  disabled?: boolean;
}) {
  function handleApply() {
    onApply({
      appliesTo: draft.appliesTo || undefined
    });
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter charges"
      description="Narrow the list by the product type a charge applies to."
      applyLabel={pending ? 'Applying…' : 'Apply filters'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
      disabled={disabled}
    >
      <ChargesFilterFields
        draft={draft}
        onDraftChange={onDraftChange}
        appliesToOptions={appliesToOptions}
        disabled={disabled || pending}
      />
    </ListFilterSheet>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientSummary, FineractOfficeOption } from '@mifos/api-client';
import { useMemo } from 'react';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import {
  type ClientListFilters,
  uniqueClientStatusOptions
} from '@/lib/fineract/clients-table-filter';
import { toSelectOptions } from '@/lib/form/select-options';

export function ClientsFilterFields({
  draft,
  onDraftChange,
  offices,
  clients,
  disabled = false
}: {
  draft: ClientListFilters;
  onDraftChange: (draft: ClientListFilters) => void;
  offices: FineractOfficeOption[];
  clients: FineractClientSummary[];
  disabled?: boolean;
}) {
  const officeOptions = useMemo(() => toSelectOptions(offices), [offices]);
  const statusOptions = useMemo(() => uniqueClientStatusOptions(clients), [clients]);

  function patchDraft(patch: Partial<ClientListFilters>) {
    onDraftChange({ ...draft, ...patch });
  }

  return (
    <ListFilterSection title="Customer criteria" description="Narrow the list by branch or status.">
      <SelectField
        id="clients-office"
        label="Branch"
        optional
        value={draft.officeId}
        onValueChange={(value) => patchDraft({ officeId: value ?? undefined })}
        options={officeOptions}
        placeholder="All branches"
        disabled={disabled}
      />
      <SelectField
        id="clients-status"
        label="Status"
        optional
        value={draft.statusCode}
        onValueChange={(value) => patchDraft({ statusCode: value ?? undefined })}
        options={statusOptions}
        placeholder="All statuses"
        disabled={disabled}
      />
    </ListFilterSection>
  );
}

export function ClientsFilterSheet({
  open,
  onOpenChange,
  offices,
  clients,
  draft,
  onDraftChange,
  onApply,
  onClear,
  pending = false,
  disabled = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offices: FineractOfficeOption[];
  clients: FineractClientSummary[];
  draft: ClientListFilters;
  onDraftChange: (draft: ClientListFilters) => void;
  onApply: (filters: ClientListFilters) => void;
  onClear: () => void;
  pending?: boolean;
  disabled?: boolean;
}) {
  function handleApply() {
    onApply({
      officeId: draft.officeId || undefined,
      statusCode: draft.statusCode || undefined
    });
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter customers"
      description="Narrow results by branch or customer status."
      applyLabel={pending ? 'Applying…' : 'Apply filters'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
      disabled={disabled}
    >
      <ClientsFilterFields
        draft={draft}
        onDraftChange={onDraftChange}
        offices={offices}
        clients={clients}
        disabled={disabled || pending}
      />
    </ListFilterSheet>
  );
}

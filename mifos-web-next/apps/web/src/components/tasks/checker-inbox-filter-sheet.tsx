'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import {
  toSelectOptions,
  type CheckerInboxClientFilterOptions,
  type CheckerInboxClientFilters
} from '@/lib/checker-inbox/client-filters';

export function CheckerInboxFilterSheet({
  open,
  onOpenChange,
  options,
  filters,
  onApply,
  onClear,
  disabled = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: CheckerInboxClientFilterOptions;
  filters: CheckerInboxClientFilters;
  onApply: (filters: CheckerInboxClientFilters) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [filters, open]);

  function patch(patch: Partial<CheckerInboxClientFilters>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleApply() {
    onApply(draft);
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter pending tasks"
      description="Narrow the list by user, action, entity, and other columns."
      applyLabel="Apply filters"
      onApply={handleApply}
      onClear={onClear}
      closeOnClear={false}
      disabled={disabled}
    >
      <ListFilterSection title="Task details">
        <SelectField
          id="checker-filter-user"
          label="User"
          optional
          value={draft.maker}
          onValueChange={(value) => patch({ maker: value })}
          options={toSelectOptions(options.makers)}
          placeholder="All users"
          disabled={disabled}
        />
        <SelectField
          id="checker-filter-action"
          label="Action"
          optional
          value={draft.actionName}
          onValueChange={(value) => patch({ actionName: value })}
          options={toSelectOptions(options.actionNames)}
          placeholder="All actions"
          disabled={disabled}
        />
        <SelectField
          id="checker-filter-entity"
          label="Entity"
          optional
          value={draft.entityName}
          onValueChange={(value) => patch({ entityName: value })}
          options={toSelectOptions(options.entityNames)}
          placeholder="All entities"
          disabled={disabled}
        />
        <SelectField
          id="checker-filter-status"
          label="Status"
          optional
          value={draft.processingResult}
          onValueChange={(value) => patch({ processingResult: value })}
          options={toSelectOptions(options.processingResults)}
          placeholder="All statuses"
          disabled={disabled}
        />
      </ListFilterSection>

      <ListFilterSection title="Identifiers">
        <TextField
          id="checker-filter-id"
          label="ID"
          optional
          value={draft.id ?? ''}
          onChange={(value) => patch({ id: value || undefined })}
          disabled={disabled}
          hint="Contains match"
        />
        <TextField
          id="checker-filter-resource-id"
          label="Resource ID"
          optional
          value={draft.resourceId ?? ''}
          onChange={(value) => patch({ resourceId: value || undefined })}
          disabled={disabled}
          hint="Contains match"
        />
      </ListFilterSection>

      <ListFilterSection title="Made on date">
        <TextField
          id="checker-filter-from-date"
          label="From"
          type="date"
          optional
          value={draft.madeOnFrom ?? ''}
          onChange={(value) => patch({ madeOnFrom: value || undefined })}
          disabled={disabled}
        />
        <TextField
          id="checker-filter-to-date"
          label="To"
          type="date"
          optional
          value={draft.madeOnTo ?? ''}
          onChange={(value) => patch({ madeOnTo: value || undefined })}
          disabled={disabled}
        />
      </ListFilterSection>
    </ListFilterSheet>
  );
}

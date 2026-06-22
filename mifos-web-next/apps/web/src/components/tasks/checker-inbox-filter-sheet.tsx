'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxSearchTemplate } from '@mifos/api-client';
import { useEffect, useMemo, useState } from 'react';
import { ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import type { CheckerInboxSearchFilters } from '@/lib/fineract/checker-inbox-query';

export function CheckerInboxFilterSheet({
  open,
  onOpenChange,
  template,
  filters,
  onApply,
  onClear,
  disabled = false,
  pending = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CheckerInboxSearchTemplate;
  filters: CheckerInboxSearchFilters;
  onApply: (filters: CheckerInboxSearchFilters) => void;
  onClear: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [filters, open]);

  const actionOptions = useMemo(
    () => template.actionNames.map((action) => ({ value: action, label: action })),
    [template.actionNames]
  );

  const entityOptions = useMemo(
    () => template.entityNames.map((entity) => ({ value: entity, label: entity })),
    [template.entityNames]
  );

  function handleApply() {
    onApply(draft);
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter checker inbox"
      description="Search by date range, action, entity, or resource ID."
      applyLabel={pending ? 'Searching…' : 'Search'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
      disabled={disabled}
    >
      <TextField
          id="checker-inbox-from-date"
          label="From date"
          type="date"
          value={draft.makerDateTimeFrom ?? ''}
          onChange={(value) =>
            setDraft((current) => ({ ...current, makerDateTimeFrom: value || undefined }))
          }
          disabled={disabled || pending}
        />
        <TextField
          id="checker-inbox-to-date"
          label="To date"
          type="date"
          value={draft.makerDateTimeto ?? ''}
          onChange={(value) =>
            setDraft((current) => ({ ...current, makerDateTimeto: value || undefined }))
          }
          disabled={disabled || pending}
        />
        <SelectField
          id="checker-inbox-action"
          label="Action"
          optional
          value={draft.actionName}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, actionName: value ?? undefined }))
          }
          options={actionOptions}
          placeholder="Any action"
          disabled={disabled || pending}
        />
        <SelectField
          id="checker-inbox-entity"
          label="Entity"
          optional
          value={draft.entityName}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, entityName: value ?? undefined }))
          }
          options={entityOptions}
          placeholder="Any entity"
          disabled={disabled || pending}
        />
        <TextField
          id="checker-inbox-resource-id"
          label="Resource ID"
          optional
          value={draft.resourceId ?? ''}
          onChange={(value) =>
            setDraft((current) => ({ ...current, resourceId: value || undefined }))
          }
        disabled={disabled || pending}
      />
    </ListFilterSheet>
  );
}

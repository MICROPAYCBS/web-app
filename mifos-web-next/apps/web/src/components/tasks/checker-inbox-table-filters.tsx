'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  countActiveCheckerInboxClientFilters,
  toSelectOptions,
  type CheckerInboxClientFilterOptions,
  type CheckerInboxClientFilters
} from '@/lib/checker-inbox/client-filters';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';

export function CheckerInboxTableFilters({
  options,
  filters,
  onChange,
  onClear,
  disabled = false
}: {
  options: CheckerInboxClientFilterOptions;
  filters: CheckerInboxClientFilters;
  onChange: (filters: CheckerInboxClientFilters) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const activeCount = countActiveCheckerInboxClientFilters(filters);

  function patch(patch: Partial<CheckerInboxClientFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Filter results</p>
        {activeCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
            Clear filters ({activeCount})
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SelectField
          id="checker-filter-user"
          label="User"
          optional
          value={filters.maker}
          onValueChange={(value) => patch({ maker: value })}
          options={toSelectOptions(options.makers)}
          placeholder="All users"
          disabled={disabled}
        />
        <SelectField
          id="checker-filter-action"
          label="Action"
          optional
          value={filters.actionName}
          onValueChange={(value) => patch({ actionName: value })}
          options={toSelectOptions(options.actionNames)}
          placeholder="All actions"
          disabled={disabled}
        />
        <SelectField
          id="checker-filter-entity"
          label="Entity"
          optional
          value={filters.entityName}
          onValueChange={(value) => patch({ entityName: value })}
          options={toSelectOptions(options.entityNames)}
          placeholder="All entities"
          disabled={disabled}
        />
        <SelectField
          id="checker-filter-status"
          label="Status"
          optional
          value={filters.processingResult}
          onValueChange={(value) => patch({ processingResult: value })}
          options={toSelectOptions(options.processingResults)}
          placeholder="All statuses"
          disabled={disabled}
        />
        <TextField
          id="checker-filter-id"
          label="ID"
          optional
          value={filters.id ?? ''}
          onChange={(value) => patch({ id: value || undefined })}
          disabled={disabled}
          hint="Contains match"
        />
        <TextField
          id="checker-filter-resource-id"
          label="Resource ID"
          optional
          value={filters.resourceId ?? ''}
          onChange={(value) => patch({ resourceId: value || undefined })}
          disabled={disabled}
          hint="Contains match"
        />
        <TextField
          id="checker-filter-from-date"
          label="Made on from"
          type="date"
          optional
          value={filters.madeOnFrom ?? ''}
          onChange={(value) => patch({ madeOnFrom: value || undefined })}
          disabled={disabled}
        />
        <TextField
          id="checker-filter-to-date"
          label="Made on to"
          type="date"
          optional
          value={filters.madeOnTo ?? ''}
          onChange={(value) => patch({ madeOnTo: value || undefined })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

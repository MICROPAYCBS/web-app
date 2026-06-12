'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CheckerInboxSearchTemplate } from '@mifos/api-client';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { Button } from '@/components/ui/button';
import type { CheckerInboxSearchFilters } from '@/lib/fineract/checker-inbox-query';

export function CheckerInboxFilters({
  template,
  filters,
  onApply,
  disabled = false
}: {
  template: CheckerInboxSearchTemplate;
  filters: CheckerInboxSearchFilters;
  onApply: (filters: CheckerInboxSearchFilters) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const actionOptions = useMemo(
    () => template.actionNames.map((action) => ({ value: action, label: action })),
    [template.actionNames]
  );

  const entityOptions = useMemo(
    () => template.entityNames.map((entity) => ({ value: entity, label: entity })),
    [template.entityNames]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TextField
        id="checker-inbox-from-date"
        label="From date"
        type="date"
        value={draft.makerDateTimeFrom ?? ''}
        onChange={(value) =>
          setDraft((current) => ({ ...current, makerDateTimeFrom: value || undefined }))
        }
        disabled={disabled}
      />
      <TextField
        id="checker-inbox-to-date"
        label="To date"
        type="date"
        value={draft.makerDateTimeto ?? ''}
        onChange={(value) =>
          setDraft((current) => ({ ...current, makerDateTimeto: value || undefined }))
        }
        disabled={disabled}
      />
      <SelectField
        id="checker-inbox-action"
        label="Action"
        value={draft.actionName}
        onValueChange={(value) =>
          setDraft((current) => ({ ...current, actionName: value ?? undefined }))
        }
        options={actionOptions}
        placeholder="Select action"
        disabled={disabled}
      />
      <SelectField
        id="checker-inbox-entity"
        label="Entity"
        value={draft.entityName}
        onValueChange={(value) =>
          setDraft((current) => ({ ...current, entityName: value ?? undefined }))
        }
        options={entityOptions}
        placeholder="Select entity"
        disabled={disabled}
      />
      <TextField
        id="checker-inbox-resource-id"
        label="Resource ID"
        value={draft.resourceId ?? ''}
        onChange={(value) =>
          setDraft((current) => ({ ...current, resourceId: value || undefined }))
        }
        disabled={disabled}
      />
      <div className="flex items-end">
        <Button type="button" disabled={disabled} onClick={() => onApply(draft)}>
          <Search className="mr-2 size-4" />
          Advanced search
        </Button>
      </div>
    </div>
  );
}

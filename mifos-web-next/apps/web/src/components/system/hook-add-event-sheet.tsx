'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractHookGrouping, FineractHookTemplate } from '@mifos/api-client';
import type { HookEventInput } from '@mifos/validation';
import { useEffect, useMemo, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';

export function HookAddEventSheet({
  open,
  onOpenChange,
  template,
  onAdd
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FineractHookTemplate;
  onAdd: (event: HookEventInput) => void;
}) {
  const [grouping, setGrouping] = useState<string>();
  const [entity, setEntity] = useState<string>();
  const [action, setAction] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const groupings = template.groupings ?? [];

  const selectedGrouping = useMemo(
    () => groupings.find((item) => item.name === grouping),
    [groupings, grouping]
  );

  const entityOptions = useMemo(
    () =>
      (selectedGrouping?.entities ?? []).map((item) => ({
        value: item.name,
        label: item.name
      })),
    [selectedGrouping]
  );

  const selectedEntity = useMemo(
    () => selectedGrouping?.entities.find((item) => item.name === entity),
    [entity, selectedGrouping]
  );

  const actionOptions = useMemo(
    () =>
      (selectedEntity?.actions ?? []).map((item) => ({
        value: item,
        label: item
      })),
    [selectedEntity]
  );

  useEffect(() => {
    if (open) {
      setGrouping(undefined);
      setEntity(undefined);
      setAction(undefined);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    setEntity(undefined);
    setAction(undefined);
  }, [grouping]);

  useEffect(() => {
    setAction(undefined);
  }, [entity]);

  function handleSubmit() {
    if (!entity || !action) {
      setError('Select an entity and action.');
      return;
    }
    onAdd({ entityName: entity, actionName: action });
    onOpenChange(false);
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Add event"
      description="Choose the entity and action that should trigger this hook."
      submitLabel="Add event"
      onSubmit={handleSubmit}
      className="data-[side=right]:sm:max-w-md"
    >
      <div className="space-y-4">
        <SelectField
          label="Grouping"
          required
          value={grouping}
          onValueChange={setGrouping}
          options={groupings.map((item: FineractHookGrouping) => ({
            value: item.name,
            label: item.name
          }))}
          placeholder="Select grouping"
        />
        <SelectField
          label="Entity"
          required
          value={entity}
          onValueChange={setEntity}
          options={entityOptions}
          placeholder="Select entity"
          disabled={!grouping}
        />
        <SelectField
          label="Action"
          required
          value={action}
          onValueChange={setAction}
          options={actionOptions}
          placeholder="Select action"
          disabled={!entity}
        />
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </FormSheet>
  );
}

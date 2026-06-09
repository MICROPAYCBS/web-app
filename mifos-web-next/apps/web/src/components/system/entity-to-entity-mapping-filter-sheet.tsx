'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { EntityMappingFilterOptions } from '@mifos/api-client';
import { useEffect, useId, useState } from 'react';
import { FormSheet } from '@/components/composites/form-sheet';
import { SelectField } from '@/components/composites/select-field';
import { Button } from '@/components/ui/button';

const ALL_OPTION = { value: '0', label: 'All' };

function toSelectOptions(options: EntityMappingFilterOptions['fromOptions']) {
  return [
    ALL_OPTION,
    ...options.map((option) => ({ value: String(option.id), label: option.name }))
  ];
}

export function EntityToEntityMappingFilterSheet({
  open,
  onOpenChange,
  filterOptions,
  fromId,
  toId,
  onApply,
  pending = false,
  disabled = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterOptions: EntityMappingFilterOptions;
  fromId: string;
  toId: string;
  onApply: (nextFromId: string, nextToId: string) => void;
  pending?: boolean;
  disabled?: boolean;
}) {
  const formId = useId();
  const [draftFromId, setDraftFromId] = useState(fromId);
  const [draftToId, setDraftToId] = useState(toId);

  useEffect(() => {
    if (open) {
      setDraftFromId(fromId);
      setDraftToId(toId);
    }
  }, [fromId, open, toId]);

  function handleApply() {
    onApply(draftFromId, draftToId);
    onOpenChange(false);
  }

  function handleReset() {
    setDraftFromId('0');
    setDraftToId('0');
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter mappings"
      description={`Narrow ${filterOptions.fromLabel.toLowerCase()} to ${filterOptions.toLabel.toLowerCase()} access rules.`}
      formId={formId}
      submitLabel={pending ? 'Applying…' : 'Apply filters'}
      submitLoading={pending}
      submitDisabled={disabled}
      onSubmit={handleApply}
    >
      <form
        id={formId}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleApply();
        }}
      >
        <SelectField
          label={filterOptions.fromLabel}
          required
          value={draftFromId}
          onValueChange={(value) => setDraftFromId(value ?? '0')}
          options={toSelectOptions(filterOptions.fromOptions)}
          disabled={disabled || pending}
        />
        <SelectField
          label={filterOptions.toLabel}
          required
          value={draftToId}
          onValueChange={(value) => setDraftToId(value ?? '0')}
          options={toSelectOptions(filterOptions.toOptions)}
          disabled={disabled || pending}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground hover:text-foreground"
          onClick={handleReset}
          disabled={disabled || pending}
        >
          Reset to all
        </Button>
      </form>
    </FormSheet>
  );
}

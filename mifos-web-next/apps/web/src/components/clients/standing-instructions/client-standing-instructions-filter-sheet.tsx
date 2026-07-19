'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '@mifos/api-client';
import { useEffect, useMemo, useState } from 'react';
import { ListFilterSection, ListFilterSheet } from '@/components/composites/list-filter-sheet';
import { SelectField } from '@/components/composites/select-field';
import { TextField } from '@/components/composites/text-field';
import { sanitizeNumericInput } from '@/components/composites/numeric-field';
import { standingInstructionEnumLabel } from '@/lib/fineract/standing-instruction-display';
import type { StandingInstructionListFilters } from '@/lib/fineract/standing-instruction-query';

function enumSelectOptions(options: FineractEnumOption[] | undefined) {
  return (options ?? []).map((opt) => ({
    value: String(opt.id),
    label: standingInstructionEnumLabel(opt)
  }));
}

export function ClientStandingInstructionsFilterSheet({
  open,
  onOpenChange,
  clientName,
  transferTypeOptions,
  filters,
  onApply,
  onClear,
  pending = false,
  disabled = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  transferTypeOptions: FineractEnumOption[];
  filters: StandingInstructionListFilters;
  onApply: (filters: StandingInstructionListFilters) => void;
  onClear: () => void;
  pending?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [filters, open]);

  const transferOptions = useMemo(
    () => enumSelectOptions(transferTypeOptions),
    [transferTypeOptions]
  );

  function handleApply() {
    onApply({
      transferType: draft.transferType || undefined,
      fromAccountId: draft.fromAccountId?.trim() || undefined
    });
  }

  return (
    <ListFilterSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter standing instructions"
      description={`Narrow transfers configured for ${clientName}.`}
      applyLabel={pending ? 'Applying…' : 'Apply filters'}
      onApply={handleApply}
      onClear={onClear}
      pending={pending}
      disabled={disabled}
    >
      <ListFilterSection title="Transfer criteria">
        <SelectField
          id="si-transfer-type"
          label="Transfer type"
          optional
          value={draft.transferType}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, transferType: value ?? undefined }))
          }
          options={transferOptions}
          placeholder="All types"
          disabled={disabled || pending}
        />
        <TextField
          id="si-from-account"
          label="From account ID"
          optional
          value={draft.fromAccountId ?? ''}
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              fromAccountId: sanitizeNumericInput(value, { integer: true }) || undefined
            }))
          }
          placeholder="Optional"
          disabled={disabled || pending}
        />
      </ListFilterSection>
    </ListFilterSheet>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useMemo, useState } from 'react';
import { SelectField } from '@/components/composites/select-field';
import {
  findSectorLookupById,
  loadSectorLookup,
  subIndustrySelectOptions,
  type SectorLookupEntry
} from '@/lib/sectors/sector-lookup';
import { cn } from '@/lib/utils';

/** Pick a sub-industry; sector and industry are derived from its parent chain. */
export function SectorCascadeSelect({
  subIndustryId,
  onSubIndustryIdChange,
  disabled = false,
  optional = true,
  error,
  className
}: {
  subIndustryId?: number;
  onSubIndustryIdChange: (subIndustryId: number | undefined) => void;
  disabled?: boolean;
  optional?: boolean;
  error?: string;
  className?: string;
}) {
  const [entries, setEntries] = useState<SectorLookupEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSectorLookup()
      .then((loaded) => {
        if (!cancelled) {
          setEntries(loaded);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load sub-industry data. Please refresh and try again.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () => (entries ? subIndustrySelectOptions(entries) : []),
    [entries]
  );

  const selectedEntry = useMemo(
    () => findSectorLookupById(subIndustryId),
    [subIndustryId]
  );

  if (loadError) {
    return (
      <p className={cn('text-sm text-destructive', className)} role="alert">
        {loadError}
      </p>
    );
  }

  if (!entries) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>Loading sub-industries…</p>
    );
  }

  return (
    <SelectField
      id="subIndustryId"
      className={className}
      label="Sub-industry"
      optional={optional}
      disabled={disabled}
      value={subIndustryId != null ? String(subIndustryId) : undefined}
      onValueChange={(value) =>
        onSubIndustryIdChange(value ? Number(value) : undefined)
      }
      options={options}
      placeholder="Select sub-industry"
      error={error}
      hint={
        selectedEntry
          ? `Sector: ${selectedEntry.sectorName} · Industry: ${selectedEntry.industryName}`
          : 'Sector and industry are set automatically from the sub-industry you choose.'
      }
    />
  );
}

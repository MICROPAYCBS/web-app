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
  loadSectorLookup,
  resolveSubIndustryId,
  selectionFromSubIndustryId
} from '@/lib/sectors/sector-lookup';
import {
  loadSectorTree,
  sortedSectorKeys,
  type SectorSelection,
  type SectorTree
} from '@/lib/sectors/sector-tree';
import { cn } from '@/lib/utils';

function toOptions(items: string[]) {
  return items.map((item) => ({ value: item, label: item }));
}

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
  const [tree, setTree] = useState<SectorTree | null>(null);
  const [lookupReady, setLookupReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selection, setSelection] = useState<SectorSelection>(() =>
    selectionFromSubIndustryId(subIndustryId)
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSectorTree(), loadSectorLookup()])
      .then(([sectorTree]) => {
        if (!cancelled) {
          setTree(sectorTree);
          setLookupReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load sector data. Please refresh and try again.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!lookupReady || subIndustryId == null) {
      return;
    }
    setSelection(selectionFromSubIndustryId(subIndustryId));
  }, [lookupReady, subIndustryId]);

  const sectors = useMemo(() => sortedSectorKeys(tree ?? undefined), [tree]);
  const industries = useMemo(
    () => (selection.sector && tree ? sortedSectorKeys(tree[selection.sector]) : []),
    [tree, selection.sector]
  );
  const subIndustries = useMemo(
    () =>
      selection.sector && selection.industry && tree?.[selection.sector]?.[selection.industry]
        ? [...tree[selection.sector][selection.industry]].sort((a, b) => a.localeCompare(b))
        : [],
    [tree, selection.sector, selection.industry]
  );

  const applySelection = (next: SectorSelection) => {
    setSelection(next);
    if (!lookupReady) {
      return;
    }
    const id = resolveSubIndustryId(next);
    onSubIndustryIdChange(id);
  };

  if (loadError) {
    return (
      <p className={cn('text-sm text-destructive sm:col-span-2', className)} role="alert">
        {loadError}
      </p>
    );
  }

  if (!tree || !lookupReady) {
    return (
      <p className={cn('text-sm text-muted-foreground sm:col-span-2', className)}>
        Loading sectors…
      </p>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:col-span-2 sm:grid-cols-2', className)}>
      <SelectField
        label="Sector"
        optional={optional}
        disabled={disabled}
        value={selection.sector || undefined}
        onValueChange={(next) =>
          applySelection({
            sector: next ?? '',
            industry: '',
            subIndustry: ''
          })
        }
        options={toOptions(sectors)}
        placeholder="Select sector"
        error={error}
      />
      <SelectField
        label="Industry"
        optional={optional}
        disabled={disabled || !selection.sector}
        value={selection.industry || undefined}
        onValueChange={(next) =>
          applySelection({
            ...selection,
            industry: next ?? '',
            subIndustry: ''
          })
        }
        options={toOptions(industries)}
        placeholder="Select industry"
      />
      <SelectField
        label="Sub-industry"
        optional={optional}
        disabled={disabled || !selection.industry}
        value={selection.subIndustry || undefined}
        onValueChange={(next) =>
          applySelection({
            ...selection,
            subIndustry: next ?? ''
          })
        }
        options={toOptions(subIndustries)}
        placeholder="Select sub-industry"
        className="sm:col-span-2"
      />
    </div>
  );
}

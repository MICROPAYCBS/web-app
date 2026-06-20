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
import type { LocationSelection } from '@/lib/locations/address-location-map';
import { loadLocationTree, sortedLocationKeys, type LocationTree } from '@/lib/locations/location-tree';
import { cn } from '@/lib/utils';

function toOptions(items: string[]) {
  return items.map((item) => ({ value: item, label: item }));
}

export function LocationCascadeSelect({
  value,
  onChange,
  disabled = false,
  className
}: {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [tree, setTree] = useState<LocationTree | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLocationTree()
      .then((data) => {
        if (!cancelled) {
          setTree(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load location data. Please refresh and try again.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const regions = useMemo(() => sortedLocationKeys(tree ?? undefined), [tree]);
  const districts = useMemo(
    () => (value.region && tree ? sortedLocationKeys(tree[value.region]) : []),
    [tree, value.region]
  );
  const counties = useMemo(
    () =>
      value.region && value.district && tree?.[value.region]?.[value.district]
        ? sortedLocationKeys(tree[value.region][value.district])
        : [],
    [tree, value.region, value.district]
  );
  const subCounties = useMemo(
    () =>
      value.region && value.district && value.county && tree?.[value.region]?.[value.district]?.[value.county]
        ? sortedLocationKeys(tree[value.region][value.district][value.county])
        : [],
    [tree, value.region, value.district, value.county]
  );
  const parishes = useMemo(
    () =>
      value.region &&
      value.district &&
      value.county &&
      value.subCounty &&
      tree?.[value.region]?.[value.district]?.[value.county]?.[value.subCounty]
        ? sortedLocationKeys(tree[value.region][value.district][value.county][value.subCounty])
        : [],
    [tree, value.region, value.district, value.county, value.subCounty]
  );
  const villages = useMemo(
    () =>
      value.region &&
      value.district &&
      value.county &&
      value.subCounty &&
      value.parish &&
      tree?.[value.region]?.[value.district]?.[value.county]?.[value.subCounty]?.[value.parish]
        ? [...tree[value.region][value.district][value.county][value.subCounty][value.parish]].sort(
            (a, b) => a.localeCompare(b)
          )
        : [],
    [tree, value.region, value.district, value.county, value.subCounty, value.parish]
  );

  if (loadError) {
    return (
      <p className={cn('text-sm text-destructive sm:col-span-2', className)} role="alert">
        {loadError}
      </p>
    );
  }

  if (!tree) {
    return (
      <p className={cn('text-sm text-muted-foreground sm:col-span-2', className)}>
        Loading locations…
      </p>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:col-span-2 sm:grid-cols-2', className)}>
      <SelectField
        label="Region"
        required
        disabled={disabled}
        value={value.region || undefined}
        onValueChange={(next) =>
          onChange({
            region: next ?? '',
            district: '',
            county: '',
            subCounty: '',
            parish: '',
            village: ''
          })
        }
        options={toOptions(regions)}
        placeholder="Select region"
      />
      <SelectField
        label="District"
        required
        disabled={disabled || !value.region}
        value={value.district || undefined}
        onValueChange={(next) =>
          onChange({
            ...value,
            district: next ?? '',
            county: '',
            subCounty: '',
            parish: '',
            village: ''
          })
        }
        options={toOptions(districts)}
        placeholder="Select district"
      />
      <SelectField
        label="County"
        required
        disabled={disabled || !value.district}
        value={value.county || undefined}
        onValueChange={(next) =>
          onChange({
            ...value,
            county: next ?? '',
            subCounty: '',
            parish: '',
            village: ''
          })
        }
        options={toOptions(counties)}
        placeholder="Select county"
      />
      <SelectField
        label="Sub-county"
        required
        disabled={disabled || !value.county}
        value={value.subCounty || undefined}
        onValueChange={(next) =>
          onChange({
            ...value,
            subCounty: next ?? '',
            parish: '',
            village: ''
          })
        }
        options={toOptions(subCounties)}
        placeholder="Select sub-county"
      />
      <SelectField
        label="Parish"
        required
        disabled={disabled || !value.subCounty}
        value={value.parish || undefined}
        onValueChange={(next) =>
          onChange({
            ...value,
            parish: next ?? '',
            village: ''
          })
        }
        options={toOptions(parishes)}
        placeholder="Select parish"
      />
      <SelectField
        label="Village"
        required
        disabled={disabled || !value.parish}
        value={value.village || undefined}
        onValueChange={(next) =>
          onChange({
            ...value,
            village: next ?? ''
          })
        }
        options={toOptions(villages)}
        placeholder="Select village"
        emptyMessage="No villages found for this parish."
      />
    </div>
  );
}

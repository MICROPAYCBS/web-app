'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { formatSectorPath, loadSectorLookup } from '@/lib/sectors/sector-lookup';

export function SectorDisplayValue({ subIndustryId }: { subIndustryId?: number | null }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (subIndustryId == null) {
      setLabel(null);
      return;
    }
    let cancelled = false;
    loadSectorLookup().then(() => {
      if (!cancelled) {
        setLabel(formatSectorPath(subIndustryId) ?? String(subIndustryId));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subIndustryId]);

  if (subIndustryId == null) {
    return null;
  }

  if (!label) {
    return <span className="text-muted-foreground">Loading…</span>;
  }

  return <span>{label}</span>;
}

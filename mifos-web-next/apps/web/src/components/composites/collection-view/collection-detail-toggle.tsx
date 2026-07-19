'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AlignLeft, Rows3 } from 'lucide-react';
import type { CollectionDetailMode } from './collection-detail-mode';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export function CollectionDetailToggle({
  mode,
  onModeChange,
  className,
  disabled
}: {
  mode: CollectionDetailMode;
  onModeChange: (mode: CollectionDetailMode) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      value={[mode]}
      onValueChange={(values) => {
        const next = values[0];
        if (next === 'summary' || next === 'fields') {
          onModeChange(next);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      disabled={disabled}
      className={cn(className)}
      aria-label="Detail display mode"
    >
      <ToggleGroupItem value="summary" aria-label="Summary view">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="fields" aria-label="Field labels view">
        <Rows3 />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LayoutGrid, List } from 'lucide-react';
import type { CollectionViewMode } from './collection-view-mode';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export function CollectionViewToggle({
  mode,
  onModeChange,
  className,
  disabled
}: {
  mode: CollectionViewMode;
  onModeChange: (mode: CollectionViewMode) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      value={[mode]}
      onValueChange={(values) => {
        const next = values[0];
        if (next === 'list' || next === 'grid') {
          onModeChange(next);
        }
      }}
      variant="outline"
      size="sm"
      spacing={0}
      disabled={disabled}
      className={cn(className)}
      aria-label="View mode"
    >
      <ToggleGroupItem value="list" aria-label="List view">
        <List />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

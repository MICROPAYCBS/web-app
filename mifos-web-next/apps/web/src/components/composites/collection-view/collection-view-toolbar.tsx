'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { CollectionDetailMode } from './collection-detail-mode';
import { CollectionDetailToggle } from './collection-detail-toggle';
import type { CollectionViewMode } from './collection-view-mode';
import { CollectionViewToggle } from './collection-view-toggle';
import { cn } from '@/lib/utils';

export function CollectionViewToolbar({
  mode,
  onModeChange,
  detailMode,
  onDetailModeChange,
  className,
  disabled
}: {
  mode: CollectionViewMode;
  onModeChange: (mode: CollectionViewMode) => void;
  detailMode: CollectionDetailMode;
  onDetailModeChange: (mode: CollectionDetailMode) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <CollectionDetailToggle
        mode={detailMode}
        onModeChange={onDetailModeChange}
        disabled={disabled}
      />
      <CollectionViewToggle mode={mode} onModeChange={onModeChange} disabled={disabled} />
    </div>
  );
}

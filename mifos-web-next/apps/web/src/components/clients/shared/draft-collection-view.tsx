'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ReactNode } from 'react';
import {
  type CollectionViewMode,
  CollectionViewLayout,
  CollectionViewToggle,
  useCollectionViewMode
} from '@/components/composites';

export function DraftCollectionView({
  storageKey,
  itemCount,
  renderItems
}: {
  storageKey: string;
  itemCount: number;
  renderItems: (mode: CollectionViewMode) => ReactNode;
}) {
  const { mode, setMode } = useCollectionViewMode(storageKey, 'list');

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <CollectionViewToggle mode={mode} onModeChange={setMode} />
      </div>
      <CollectionViewLayout mode={mode}>{renderItems(mode)}</CollectionViewLayout>
    </div>
  );
}

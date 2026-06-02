'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import {
  type CollectionViewMode,
  readStoredCollectionViewMode,
  writeStoredCollectionViewMode
} from './collection-view-mode';

export function useCollectionViewMode(
  storageKey: string,
  defaultMode: CollectionViewMode = 'list'
) {
  const [mode, setModeState] = useState<CollectionViewMode>(defaultMode);

  useEffect(() => {
    const stored = readStoredCollectionViewMode(storageKey);
    if (stored) {
      setModeState(stored);
    }
  }, [storageKey]);

  function setMode(next: CollectionViewMode) {
    setModeState(next);
    writeStoredCollectionViewMode(storageKey, next);
  }

  return { mode, setMode };
}

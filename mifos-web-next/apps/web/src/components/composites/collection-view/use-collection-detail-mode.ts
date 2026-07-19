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
  type CollectionDetailMode,
  readStoredCollectionDetailMode,
  writeStoredCollectionDetailMode
} from './collection-detail-mode';

export function useCollectionDetailMode(
  storageKey: string,
  defaultMode: CollectionDetailMode = 'summary'
) {
  const [mode, setModeState] = useState<CollectionDetailMode>(defaultMode);

  useEffect(() => {
    const stored = readStoredCollectionDetailMode(storageKey);
    if (stored) {
      setModeState(stored);
    }
  }, [storageKey]);

  function setMode(next: CollectionDetailMode) {
    setModeState(next);
    writeStoredCollectionDetailMode(storageKey, next);
  }

  return { mode, setMode };
}

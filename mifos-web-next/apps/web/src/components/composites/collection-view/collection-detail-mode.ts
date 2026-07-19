/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type CollectionDetailMode = 'summary' | 'fields';

export const COLLECTION_DETAIL_MODES: CollectionDetailMode[] = ['summary', 'fields'];

export function isCollectionDetailMode(value: string): value is CollectionDetailMode {
  return value === 'summary' || value === 'fields';
}

export function readStoredCollectionDetailMode(storageKey: string): CollectionDetailMode | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored && isCollectionDetailMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredCollectionDetailMode(
  storageKey: string,
  mode: CollectionDetailMode
): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // Ignore quota / privacy errors.
  }
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type CollectionViewMode = 'list' | 'grid';

export const COLLECTION_VIEW_MODES: CollectionViewMode[] = ['list', 'grid'];

export function isCollectionViewMode(value: string): value is CollectionViewMode {
  return value === 'list' || value === 'grid';
}

export function readStoredCollectionViewMode(storageKey: string): CollectionViewMode | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored && isCollectionViewMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredCollectionViewMode(storageKey: string, mode: CollectionViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, mode);
  } catch {
    // Ignore quota / privacy errors.
  }
}

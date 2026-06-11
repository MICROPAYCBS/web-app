/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { VisibilityState } from '@tanstack/react-table';

export function readStoredColumnVisibility(storageKey: string): VisibilityState | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const visibility: VisibilityState = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'boolean') {
        visibility[key] = value;
      }
    }
    return visibility;
  } catch {
    return null;
  }
}

export function writeStoredColumnVisibility(storageKey: string, visibility: VisibilityState): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(visibility));
  } catch {
    // Ignore quota / privacy errors.
  }
}

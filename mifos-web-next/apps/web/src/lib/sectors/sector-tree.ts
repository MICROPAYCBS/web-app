/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Sector → industry → sub-industry names (from sectors.json). */
export type SectorTree = {
  [sector: string]: {
    [industry: string]: string[];
  };
};

const SECTORS_URL = '/data/sectors.json';

let cachedTree: SectorTree | null = null;
let loadPromise: Promise<SectorTree> | null = null;

export async function loadSectorTree(): Promise<SectorTree> {
  if (cachedTree) {
    return cachedTree;
  }
  if (!loadPromise) {
    loadPromise = fetch(SECTORS_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load sectors (${response.status})`);
        }
        return response.json() as Promise<SectorTree>;
      })
      .then((tree) => {
        cachedTree = tree;
        return tree;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function sortedSectorKeys(record: Record<string, unknown> | undefined): string[] {
  if (!record) {
    return [];
  }
  return Object.keys(record).sort((a, b) => a.localeCompare(b));
}

export type SectorSelection = {
  sector: string;
  industry: string;
  subIndustry: string;
};

export const emptySectorSelection = (): SectorSelection => ({
  sector: '',
  industry: '',
  subIndustry: ''
});

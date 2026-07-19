/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type LocationTree = {
  [region: string]: {
    [district: string]: {
      [county: string]: {
        [subCounty: string]: {
          [parish: string]: string[];
        };
      };
    };
  };
};

const LOCATIONS_URL = '/data/locations.json';

let cachedTree: LocationTree | null = null;
let loadPromise: Promise<LocationTree> | null = null;

export async function loadLocationTree(): Promise<LocationTree> {
  if (cachedTree) {
    return cachedTree;
  }
  if (!loadPromise) {
    loadPromise = fetch(LOCATIONS_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load locations (${response.status})`);
        }
        return response.json() as Promise<LocationTree>;
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

export function sortedLocationKeys(record: Record<string, unknown> | undefined): string[] {
  if (!record) {
    return [];
  }
  return Object.keys(record).sort((a, b) => a.localeCompare(b));
}

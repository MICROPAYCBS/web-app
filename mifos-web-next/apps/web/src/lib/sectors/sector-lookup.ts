/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SectorSelection } from '@/lib/sectors/sector-tree';

export type SectorLookupEntry = {
  subIndustryId: number;
  sectorName: string;
  industryName: string;
  subIndustryName: string;
  subIndustryCode: string;
};

const LOOKUP_URL = '/data/sectors-lookup.json';

let cachedLookup: SectorLookupEntry[] | null = null;
let byId: Map<number, SectorLookupEntry> | null = null;
let byPath: Map<string, number> | null = null;
let loadPromise: Promise<SectorLookupEntry[]> | null = null;

function lookupPathKey(sector: string, industry: string, subIndustry: string): string {
  return `${sector}\0${industry}\0${subIndustry}`;
}

function buildIndexes(entries: SectorLookupEntry[]) {
  byId = new Map(entries.map((entry) => [entry.subIndustryId, entry]));
  byPath = new Map(
    entries.map((entry) => [
      lookupPathKey(entry.sectorName, entry.industryName, entry.subIndustryName),
      entry.subIndustryId
    ])
  );
}

export async function loadSectorLookup(): Promise<SectorLookupEntry[]> {
  if (cachedLookup) {
    return cachedLookup;
  }
  if (!loadPromise) {
    loadPromise = fetch(LOOKUP_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load sector lookup (${response.status})`);
        }
        return response.json() as Promise<SectorLookupEntry[]>;
      })
      .then((entries) => {
        cachedLookup = entries;
        buildIndexes(entries);
        return entries;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function findSectorLookupById(subIndustryId: number | undefined | null): SectorLookupEntry | undefined {
  if (subIndustryId == null || !byId) {
    return undefined;
  }
  return byId.get(subIndustryId);
}

export function resolveSubIndustryId(selection: SectorSelection): number | undefined {
  if (!selection.sector || !selection.industry || !selection.subIndustry || !byPath) {
    return undefined;
  }
  return byPath.get(lookupPathKey(selection.sector, selection.industry, selection.subIndustry));
}

export function selectionFromSubIndustryId(subIndustryId: number | undefined | null): SectorSelection {
  const entry = findSectorLookupById(subIndustryId);
  if (!entry) {
    return { sector: '', industry: '', subIndustry: '' };
  }
  return {
    sector: entry.sectorName,
    industry: entry.industryName,
    subIndustry: entry.subIndustryName
  };
}

export function formatSectorPath(subIndustryId: number | undefined | null): string | undefined {
  const entry = findSectorLookupById(subIndustryId);
  if (!entry) {
    return undefined;
  }
  return `${entry.sectorName} / ${entry.industryName} / ${entry.subIndustryName}`;
}

/** Sorted sub-industry options for a single select (parents resolved from lookup). */
export function subIndustrySelectOptions(entries: SectorLookupEntry[]) {
  return [...entries]
    .sort((a, b) => a.subIndustryName.localeCompare(b.subIndustryName))
    .map((entry) => ({
      value: String(entry.subIndustryId),
      label: entry.subIndustryName,
      keywords: [entry.sectorName, entry.industryName, entry.subIndustryCode]
    }));
}

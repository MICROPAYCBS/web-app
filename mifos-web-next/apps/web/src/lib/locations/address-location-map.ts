/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractEnumOption } from '@mifos/api-client';
import type { ClientAddressEntry } from '@mifos/validation';
import { fineractOptionLabel } from '@/lib/form/select-options';

export type LocationSelection = {
  region: string;
  district: string;
  county: string;
  subCounty: string;
  parish: string;
  village: string;
};

export const EMPTY_LOCATION_SELECTION: LocationSelection = {
  region: '',
  district: '',
  county: '',
  subCounty: '',
  parish: '',
  village: ''
};

export {
  isLocationCascadeEnabled,
  isLocationCascadeUiEnabled,
  shouldUseLocationCascade
} from '@/lib/locations/location-cascade-config';

export function regionNameFromStateProvinceId(
  stateProvinceId: number | undefined,
  options: FineractEnumOption[] | undefined
): string {
  if (stateProvinceId == null || !options?.length) {
    return '';
  }
  const match = options.find((option) => option.id === stateProvinceId);
  return match ? fineractOptionLabel(match) : '';
}

export function stateProvinceIdFromRegionName(
  region: string,
  options: FineractEnumOption[] | undefined
): number | undefined {
  if (!region.trim() || !options?.length) {
    return undefined;
  }
  const normalized = region.trim().toLowerCase();
  const match = options.find(
    (option) => fineractOptionLabel(option).trim().toLowerCase() === normalized
  );
  return match?.id;
}

export function locationSelectionFromAddress(
  entry: Partial<ClientAddressEntry>,
  stateProvinceOptions: FineractEnumOption[] | undefined
): LocationSelection {
  return {
    region: regionNameFromStateProvinceId(entry.stateProvinceId, stateProvinceOptions),
    district: entry.city ?? '',
    county: entry.countyDistrict ?? '',
    subCounty: entry.addressLine1 ?? '',
    parish: entry.addressLine2 ?? '',
    village: entry.townVillage ?? ''
  };
}

export function addressFieldsFromLocationSelection(
  selection: LocationSelection,
  stateProvinceOptions: FineractEnumOption[] | undefined
): Pick<
  ClientAddressEntry,
  'stateProvinceId' | 'city' | 'countyDistrict' | 'addressLine1' | 'addressLine2' | 'townVillage'
> {
  return {
    stateProvinceId: stateProvinceIdFromRegionName(selection.region, stateProvinceOptions),
    city: selection.district || undefined,
    countyDistrict: selection.county || undefined,
    addressLine1: selection.subCounty || undefined,
    addressLine2: selection.parish || undefined,
    townVillage: selection.village || undefined
  };
}

export function isLocationSelectionComplete(selection: LocationSelection): boolean {
  return (
    Boolean(selection.region) &&
    Boolean(selection.district) &&
    Boolean(selection.county) &&
    Boolean(selection.subCounty) &&
    Boolean(selection.parish) &&
    Boolean(selection.village)
  );
}

export function formatLocationAddressSummary(
  entry: Partial<ClientAddressEntry>,
  stateProvinceOptions?: FineractEnumOption[]
): string {
  const region = regionNameFromStateProvinceId(entry.stateProvinceId, stateProvinceOptions);
  const line = [
    entry.townVillage,
    entry.addressLine2,
    entry.addressLine1,
    entry.countyDistrict,
    entry.city,
    region
  ]
    .filter(Boolean)
    .join(', ');
  return line || 'No address details on file';
}

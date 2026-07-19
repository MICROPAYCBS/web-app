/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAddressFieldConfig } from '@mifos/api-client';

const LOCATION_CASCADE_FIELDS = [
  'stateProvinceId',
  'city',
  'countyDistrict',
  'addressLine1',
  'addressLine2',
  'townVillage'
] as const;

const LOCATION_CASCADE_FIELD_LABELS: Record<(typeof LOCATION_CASCADE_FIELDS)[number], string> = {
  stateProvinceId: 'Region (stateProvinceId)',
  city: 'District (city)',
  countyDistrict: 'County (countyDistrict)',
  addressLine1: 'Sub-county (addressLine1)',
  addressLine2: 'Parish (addressLine2)',
  townVillage: 'Village (townVillage)'
};

function isFieldEnabled(config: FineractAddressFieldConfig[], field: string): boolean {
  return config.find((item) => item.field === field)?.isEnabled ?? false;
}

/** Micropay ships locations.json — cascade UI is on unless explicitly disabled. */
export function isLocationCascadeUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_LOCATION_CASCADE !== 'false';
}

export function isLocationCascadeEnabled(config: FineractAddressFieldConfig[]): boolean {
  return LOCATION_CASCADE_FIELDS.every((field) => isFieldEnabled(config, field));
}

export function shouldUseLocationCascade(config: FineractAddressFieldConfig[]): boolean {
  return isLocationCascadeUiEnabled() || isLocationCascadeEnabled(config);
}

export function getLocationCascadeServerReadiness(config: FineractAddressFieldConfig[]): {
  ready: boolean;
  missingEnabledFields: string[];
} {
  const missingEnabledFields = LOCATION_CASCADE_FIELDS.filter(
    (field) => !isFieldEnabled(config, field)
  ).map((field) => LOCATION_CASCADE_FIELD_LABELS[field]);

  return {
    ready: missingEnabledFields.length === 0,
    missingEnabledFields
  };
}

export function locationCascadeServerReadinessMessage(
  config: FineractAddressFieldConfig[]
): string | null {
  const { ready, missingEnabledFields } = getLocationCascadeServerReadiness(config);
  if (ready) {
    return null;
  }
  return `Fineract address field configuration is incomplete for location capture. Enable on the tenant: ${missingEnabledFields.join(', ')} (Micropay migration V3012).`;
}

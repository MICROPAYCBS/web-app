/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const ADDRESS_FIELD_LABELS: Record<string, string> = {
  addressType: 'Address type',
  street: 'Street / landmark',
  addressLine1: 'Sub-county',
  addressLine2: 'Parish',
  addressLine3: 'Address line 3',
  townVillage: 'Village',
  city: 'District',
  countyDistrict: 'County',
  stateProvinceId: 'Region',
  countryId: 'Country',
  postalCode: 'Postal code',
  latitude: 'Latitude (GPS)',
  longitude: 'Longitude (GPS)',
  isActive: 'Active',
  isPrimary: 'Primary',
  createdBy: 'Created by',
  createdOn: 'Created on',
  updatedBy: 'Updated by',
  updatedOn: 'Updated on'
};

export function addressFieldConfigurationLabel(field: string): string {
  return ADDRESS_FIELD_LABELS[field] ?? field;
}

export function addressSubentityLabel(subentity: string): string {
  if (subentity === 'CLIENT') {
    return 'Customer';
  }
  return subentity || '—';
}

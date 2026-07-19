/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractFieldConfiguration } from '@mifos/api-client';

type RawFineractFieldConfiguration = {
  fieldConfigurationId?: number;
  field_configuration_id?: number;
  entity?: string;
  subentity?: string;
  field?: string;
  isEnabled?: boolean;
  is_enabled?: boolean;
  isMandatory?: boolean;
  is_mandatory?: boolean;
  validationRegex?: string | null;
  validation_regex?: string | null;
};

function readBoolean(value: boolean | undefined): boolean {
  return Boolean(value);
}

function readString(value: string | null | undefined): string {
  return value ?? '';
}

export function normalizeFieldConfiguration(
  raw: RawFineractFieldConfiguration
): FineractFieldConfiguration {
  const fieldConfigurationId = raw.fieldConfigurationId ?? raw.field_configuration_id;
  const field = raw.field;

  if (fieldConfigurationId == null || Number.isNaN(Number(fieldConfigurationId))) {
    throw new Error('Field configuration response is missing fieldConfigurationId.');
  }
  if (!field) {
    throw new Error('Field configuration response is missing field.');
  }

  return {
    fieldConfigurationId: Number(fieldConfigurationId),
    entity: readString(raw.entity),
    subentity: readString(raw.subentity),
    field,
    isEnabled: readBoolean(raw.isEnabled ?? raw.is_enabled),
    isMandatory: readBoolean(raw.isMandatory ?? raw.is_mandatory),
    validationRegex: readString(raw.validationRegex ?? raw.validation_regex)
  };
}

export function normalizeFieldConfigurationList(
  raw: RawFineractFieldConfiguration[] | null | undefined
): FineractFieldConfiguration[] {
  if (!raw?.length) {
    return [];
  }
  return raw.map(normalizeFieldConfiguration);
}

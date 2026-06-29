/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { cache } from 'react';

import type { FineractFieldConfiguration } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { normalizeFieldConfigurationList } from '@/lib/fineract/field-configuration-normalize';

export const FIELD_CONFIGURATION_ENTITY_ADDRESS = 'ADDRESS' as const;

export type FieldConfigurationEntitySlug = 'address';

const ENTITY_SLUG_TO_FINERACT: Record<FieldConfigurationEntitySlug, string> = {
  address: FIELD_CONFIGURATION_ENTITY_ADDRESS
};

export function resolveFieldConfigurationEntity(slug: string): string | null {
  const normalized = slug.trim().toLowerCase() as FieldConfigurationEntitySlug;
  return ENTITY_SLUG_TO_FINERACT[normalized] ?? null;
}

export function isFieldConfigurationEntitySlug(slug: string): slug is FieldConfigurationEntitySlug {
  return resolveFieldConfigurationEntity(slug) != null;
}

export const getFieldConfiguration = cache(async (entity: string): Promise<FineractFieldConfiguration[]> => {
  const fineract = await createFineractClient();
  const raw = await fineract.get<Parameters<typeof normalizeFieldConfigurationList>[0]>(
    `/fieldconfiguration/${entity}`
  );
  return normalizeFieldConfigurationList(raw);
});

export async function getAddressFieldConfiguration(): Promise<FineractFieldConfiguration[]> {
  return getFieldConfiguration(FIELD_CONFIGURATION_ENTITY_ADDRESS);
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON } from '@mifos/validation';

export type ClientEntitySubType = 'person' | 'entity';

export interface DatatableEntitySubTypeSource {
  entitySubType?: string;
  subentityType?: string;
}

export function normalizeEntitySubType(value?: string | null): ClientEntitySubType | null {
  if (!value?.trim()) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'person') {
    return 'person';
  }
  if (normalized === 'entity') {
    return 'entity';
  }
  return null;
}

export function legalFormIdToEntitySubType(legalFormId: number): ClientEntitySubType {
  return legalFormId === LEGAL_FORM_ENTITY ? 'entity' : 'person';
}

export function registrationEntitySubType(
  registration: DatatableEntitySubTypeSource
): string | undefined {
  return registration.entitySubType?.trim() || registration.subentityType?.trim() || undefined;
}

/**
 * Whether a client datatable applies to the client's legal form.
 *
 * @param allowUniversal When true (client detail/nav), tables without a subtype apply to all clients.
 *   When false (create wizard), only tables with an explicit matching subtype are included.
 */
export function datatableMatchesLegalForm(
  registration: DatatableEntitySubTypeSource,
  legalFormId: number,
  options?: { allowUniversal?: boolean }
): boolean {
  const allowUniversal = options?.allowUniversal ?? true;
  const subtype = normalizeEntitySubType(registrationEntitySubType(registration));
  if (!subtype) {
    return allowUniversal;
  }
  return subtype === legalFormIdToEntitySubType(legalFormId);
}

export { LEGAL_FORM_ENTITY, LEGAL_FORM_PERSON };

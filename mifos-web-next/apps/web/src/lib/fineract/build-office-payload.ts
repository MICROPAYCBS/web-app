/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { BranchProfilePayload, CreateOfficePayload, UpdateOfficePayload } from '@mifos/validation';
import {
  FINERACT_DATE_FORMAT,
  FINERACT_LOCALE,
  normalizeFineractDateField
} from '@/lib/fineract/dates';

function stripEmpty<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  for (const key of Object.keys(next)) {
    const value = next[key];
    if (value === '' || value === undefined) {
      delete next[key];
    }
  }
  return next;
}

function buildBranchProfilePayload(
  profile?: BranchProfilePayload
): Record<string, unknown> | undefined {
  if (!profile) {
    return undefined;
  }
  const next = stripEmpty({ ...profile });
  return Object.keys(next).length > 0 ? next : undefined;
}

export function buildOfficePayload(
  input: CreateOfficePayload | UpdateOfficePayload
): Record<string, unknown> {
  const dateFormat = input.dateFormat ?? FINERACT_DATE_FORMAT;
  const locale = input.locale ?? FINERACT_LOCALE;
  const branchProfile = buildBranchProfilePayload(input.branchProfile);
  const { branchProfile: _ignored, ...rest } = input;

  return stripEmpty({
    ...rest,
    dateFormat,
    locale,
    openingDate: normalizeFineractDateField(input.openingDate),
    externalId: input.externalId === '' ? undefined : input.externalId,
    ...(branchProfile ? { branchProfile } : {})
  });
}

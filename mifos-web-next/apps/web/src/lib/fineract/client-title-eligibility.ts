/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { ClientTitleOption, FineractEnumOption } from '@mifos/api-client';

export function filterEligibleClientTitles(
  titles: ClientTitleOption[] | FineractEnumOption[] | undefined,
  genderId?: number
): FineractEnumOption[] {
  if (!titles?.length) {
    return [];
  }

  const withGender = titles as ClientTitleOption[];
  if (withGender.some((title) => 'genderId' in title)) {
    return withGender
      .filter((title) => title.genderId == null || title.genderId === genderId)
      .map((title) => ({ id: title.id, name: title.titleName ?? '' }));
  }

  return titles.map((title) => ({
    id: title.id,
    name: 'name' in title && title.name ? title.name : ''
  }));
}

export function formatGenderLabel(genderId?: number): string | undefined {
  switch (genderId) {
    case 1:
      return 'Male';
    case 2:
      return 'Female';
    default:
      return undefined;
  }
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { SelectOption } from '@/components/composites/select-field';

type FineractOptionLike = {
  id: number;
  name?: string;
  value?: string;
  displayName?: string;
};

/** Human-readable label — never show raw numeric id when a name exists. */
export function fineractOptionLabel(option: FineractOptionLike): string {
  const candidate = option.displayName ?? option.name ?? option.value;
  if (candidate && candidate !== String(option.id)) {
    return candidate;
  }
  if (option.name) {
    return option.name;
  }
  if (option.value && Number.isNaN(Number(option.value))) {
    return option.value;
  }
  return `Option ${option.id}`;
}

export function toSelectOptions(
  items: FineractOptionLike[] | undefined
): SelectOption[] {
  if (!items?.length) {
    return [];
  }
  return items.map((item) => {
    const label = fineractOptionLabel(item);
    return {
      value: String(item.id),
      label,
      keywords: [label, String(item.id)]
    };
  });
}

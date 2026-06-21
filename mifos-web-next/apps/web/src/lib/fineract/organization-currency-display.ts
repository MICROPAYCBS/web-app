/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCurrencyOption } from '@mifos/api-client';

export function organizationCurrencyLabel(currency: FineractCurrencyOption): string {
  const code = currency.code?.trim();
  const name = currency.name?.trim();
  if (name && code) {
    return `${name} (${code})`;
  }
  return name || code || '—';
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractUserDetail } from '@mifos/api-client';

export function formatUserDisplayName(user: Pick<FineractUserDetail, 'firstname' | 'lastname' | 'username'>) {
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
  return fullName || user.username;
}

export function yesNoLabel(value: boolean) {
  return value ? 'Yes' : 'No';
}

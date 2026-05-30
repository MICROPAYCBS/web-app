/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export function getFineractConfig() {
  return {
    baseUrl: process.env.NEXT_PUBLIC_FINERACT_API_URL ?? '/fineract-provider/api/v1',
    tenantId: process.env.NEXT_PUBLIC_FINERACT_TENANT_ID ?? 'default'
  };
}

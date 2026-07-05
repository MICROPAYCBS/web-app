/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';

export const STRUCTURED_ACCOUNT_NUMBER_FORMATS_CONFIG_NAME = 'structured-account-number-formats';

export async function getStructuredAccountNumberFormatsEnabled(): Promise<boolean> {
  const configuration = await getGlobalConfigurationByName(
    STRUCTURED_ACCOUNT_NUMBER_FORMATS_CONFIG_NAME
  );
  return configuration?.enabled === true;
}

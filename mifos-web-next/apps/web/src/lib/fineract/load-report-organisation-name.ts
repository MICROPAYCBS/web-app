/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import {
  DEFAULT_REPORT_ORG_NAME,
  ORGANISATION_DISPLAY_NAME_CONFIG_NAME,
  resolveReportOrganisationName
} from '@/lib/fineract/report-branding';
import { tryFineractLoad } from '@/lib/fineract/safe-load';

export async function loadReportOrganisationName(): Promise<string> {
  const result = await tryFineractLoad(
    () => getGlobalConfigurationByName(ORGANISATION_DISPLAY_NAME_CONFIG_NAME),
    'Could not load report branding.'
  );
  if (!result.ok) {
    return DEFAULT_REPORT_ORG_NAME;
  }
  return resolveReportOrganisationName(result.data);
}

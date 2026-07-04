/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import { APP_NAME } from '@/lib/branding';

/** Fineract global configuration key for printable report branding. */
export const ORGANISATION_DISPLAY_NAME_CONFIG_NAME = 'organisation-display-name';

/** Fallback when the configuration has no string value. */
export const DEFAULT_REPORT_ORG_NAME = APP_NAME;

export function resolveReportOrganisationName(
  configuration: FineractGlobalConfiguration | null | undefined
): string {
  const configured = configuration?.stringValue?.trim();
  return configured || DEFAULT_REPORT_ORG_NAME;
}

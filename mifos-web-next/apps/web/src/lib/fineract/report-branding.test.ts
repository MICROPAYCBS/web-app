/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractGlobalConfiguration } from '@mifos/api-client';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_REPORT_ORG_NAME,
  resolveReportOrganisationName
} from '@/lib/fineract/report-branding';

function configuration(stringValue: string | null): FineractGlobalConfiguration {
  return {
    id: 1,
    name: 'organisation-display-name',
    enabled: true,
    value: null,
    stringValue,
    dateValue: null,
    description: null,
    trapDoor: false
  };
}

describe('resolveReportOrganisationName', () => {
  it('uses configured string value when set', () => {
    assert.equal(
      resolveReportOrganisationName(configuration('MicroPay Savings Bank')),
      'MicroPay Savings Bank'
    );
  });

  it('falls back to the app name when configuration is missing or empty', () => {
    assert.equal(resolveReportOrganisationName(null), DEFAULT_REPORT_ORG_NAME);
    assert.equal(resolveReportOrganisationName(configuration('')), DEFAULT_REPORT_ORG_NAME);
    assert.equal(resolveReportOrganisationName(configuration('   ')), DEFAULT_REPORT_ORG_NAME);
  });
});

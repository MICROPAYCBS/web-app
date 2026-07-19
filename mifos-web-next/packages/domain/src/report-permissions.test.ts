/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isMissingReportReadPermissionMessage,
  reportReadPermissionCode
} from './report-permissions';

describe('reportReadPermissionCode', () => {
  it('prefixes report names with READ_', () => {
    assert.equal(
      reportReadPermissionCode('Members without share purchases on a given date.'),
      'READ_Members without share purchases on a given date.'
    );
  });
});

describe('isMissingReportReadPermissionMessage', () => {
  it('detects Fineract permission-not-found errors', () => {
    assert.equal(
      isMissingReportReadPermissionMessage(
        'Permission with Code READ_Members without share purchases on a given date. does not exist',
        'Members without share purchases on a given date.'
      ),
      true
    );
  });

  it('returns false for unrelated errors', () => {
    assert.equal(isMissingReportReadPermissionMessage('Core Reports Cannot be Deleted'), false);
  });
});

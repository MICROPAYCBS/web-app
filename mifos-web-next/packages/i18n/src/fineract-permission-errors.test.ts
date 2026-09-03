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
  collectFineractPermissionCodes,
  extractFineractPermissionCode,
  formatMissingPermissionMessage,
  inferReadPermissionFromApiPath,
  resolveFineractPermissionDeniedMessage
} from './fineract-permission-errors';

describe('extractFineractPermissionCode', () => {
  it('reads bare permission codes', () => {
    assert.equal(extractFineractPermissionCode('READ_CURRENCY'), 'READ_CURRENCY');
  });

  it('reads authority prose', () => {
    assert.equal(
      extractFineractPermissionCode('User has no authority to: READ_JOURNALENTRY'),
      'READ_JOURNALENTRY'
    );
  });
});

describe('collectFineractPermissionCodes', () => {
  it('collects nested authority errors', () => {
    assert.deepEqual(
      collectFineractPermissionCodes({
        defaultUserMessage: 'Insufficient privileges to perform this action.',
        errors: [{ defaultUserMessage: 'User has no authority to: READ_CURRENCY' }]
      }),
      ['READ_CURRENCY']
    );
  });
});

describe('inferReadPermissionFromApiPath', () => {
  it('maps common read endpoints', () => {
    assert.equal(inferReadPermissionFromApiPath('/currencies'), 'READ_CURRENCY');
    assert.equal(inferReadPermissionFromApiPath('journalentries'), 'READ_JOURNALENTRY');
  });
});

describe('resolveFineractPermissionDeniedMessage', () => {
  it('formats generic 403 responses with the request path fallback', () => {
    assert.equal(
      resolveFineractPermissionDeniedMessage(
        null,
        403,
        '/currencies',
        'You do not have permission to perform this action.'
      ),
      formatMissingPermissionMessage('READ_CURRENCY')
    );
  });

  it('keeps specific non-403 authority prose', () => {
    assert.equal(
      resolveFineractPermissionDeniedMessage(
        null,
        undefined,
        undefined,
        'User has no authority to: UPDATE_COMPLIANCEPROFILE'
      ),
      'User has no authority to: UPDATE_COMPLIANCEPROFILE'
    );
  });

  it('formats bare permission codes', () => {
    assert.equal(
      resolveFineractPermissionDeniedMessage(null, undefined, undefined, 'READ_CURRENCY'),
      formatMissingPermissionMessage('READ_CURRENCY')
    );
  });
});

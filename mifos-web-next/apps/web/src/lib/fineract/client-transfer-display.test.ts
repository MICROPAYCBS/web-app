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
  destinationOfficeIdFromClient,
  destinationOfficeNameFromClient,
  formatOfficeDisplayName
} from './client-transfer-display';

describe('destinationOfficeNameFromClient', () => {
  it('prefers Fineract flat transferToOfficeName', () => {
    assert.equal(
      destinationOfficeNameFromClient({
        transferToOfficeName: '  Branch B  ',
        transferToOffice: { id: 1, name: 'Nested' }
      }),
      'Branch B'
    );
  });

  it('falls back to nested transferToOffice', () => {
    assert.equal(
      destinationOfficeNameFromClient({
        transferToOffice: { id: 2, name: 'Plain', nameDecorated: '.... Branch B' }
      }),
      '.... Branch B'
    );
  });

  it('returns undefined when no destination office fields are present', () => {
    assert.equal(destinationOfficeNameFromClient({}), undefined);
  });
});

describe('destinationOfficeIdFromClient', () => {
  it('reads flat transferToOfficeId first', () => {
    assert.equal(
      destinationOfficeIdFromClient({
        transferToOfficeId: 5,
        transferToOffice: { id: 9, name: 'Other' }
      }),
      5
    );
  });
});

describe('formatOfficeDisplayName', () => {
  it('prefers nameDecorated over name', () => {
    assert.equal(formatOfficeDisplayName({ name: 'A', nameDecorated: '.... A' }), '.... A');
  });
});

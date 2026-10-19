/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toFineractClientIdentifierBody } from './client-identifier-payload';

const base = {
  documentTypeId: 1,
  documentKey: 'CM12345678',
  status: 'Active' as const,
  description: 'National ID'
};

describe('toFineractClientIdentifierBody', () => {
  it('omits dates on create when they are empty', () => {
    const body = toFineractClientIdentifierBody(base, 'create');
    assert.equal('issuanceDate' in body, false);
    assert.equal('expiryDate' in body, false);
    assert.equal('dateFormat' in body, false);
  });

  it('sends locale and dateFormat on create when a date is present', () => {
    const body = toFineractClientIdentifierBody(
      { ...base, issuanceDate: '2024-01-01', expiryDate: '2034-01-01' },
      'create'
    );
    assert.equal(body.issuanceDate, '01 January 2024');
    assert.equal(body.expiryDate, '01 January 2034');
    assert.equal(body.dateFormat, 'dd MMMM yyyy');
    assert.equal(body.locale, 'en');
  });

  it('sends explicit nulls on update so cleared dates are not dropped', () => {
    const body = toFineractClientIdentifierBody(base, 'update');
    assert.equal(body.issuanceDate, null);
    assert.equal(body.expiryDate, null);
    assert.equal(JSON.parse(JSON.stringify(body)).issuanceDate, null);
  });
});

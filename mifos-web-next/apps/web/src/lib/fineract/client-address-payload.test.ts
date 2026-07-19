/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toClientAddressRequestBody } from './client-address-payload';

describe('toClientAddressRequestBody', () => {
  it('omits addressTypeId from the POST body', () => {
    const body = toClientAddressRequestBody({
      addressTypeId: 1,
      street: 'Main St',
      city: 'Kampala'
    });
    assert.equal('addressTypeId' in body, false);
    assert.equal(body.street, 'Main St');
    assert.equal(body.city, 'Kampala');
  });

  it('includes addressId on update when requested', () => {
    const body = toClientAddressRequestBody(
      { addressTypeId: 1, addressId: 42, city: 'Kampala' },
      { includeAddressId: true }
    );
    assert.equal(body.addressId, 42);
    assert.equal('addressTypeId' in body, false);
  });

  it('passes latitude and longitude to Fineract', () => {
    const body = toClientAddressRequestBody({
      addressTypeId: 1,
      latitude: 0.347596,
      longitude: 32.58252
    });
    assert.equal(body.latitude, 0.347596);
    assert.equal(body.longitude, 32.58252);
  });
});

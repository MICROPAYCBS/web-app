/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { FineractClientAddress } from '@mifos/api-client';
import { normalizeClientAddress, normalizeClientAddresses } from './client-address-normalize';

test('normalizeClientAddress keeps m_address.id as addressId and exposes clientAddressId', () => {
  const raw = {
    addressId: 2,
    clientAddressId: 5,
    addressTypeId: 24,
    addressType: 'Residential'
  } as FineractClientAddress;

  const normalized = normalizeClientAddress(raw);
  assert.equal(normalized.addressId, 2);
  assert.equal(normalized.clientAddressId, 5);
});

test('normalizeClientAddress maps legacy id field to addressId', () => {
  const raw = {
    id: 9,
    clientAddressId: 5,
    addressTypeId: 24,
    addressType: 'Residential'
  } as FineractClientAddress & { id: number };

  const normalized = normalizeClientAddress(raw);
  assert.equal(normalized.addressId, 9);
  assert.equal(normalized.isActive, true);
  assert.equal(normalized.isPrimary, false);
});

test('normalizeClientAddress rejects missing addressId', () => {
  assert.throws(
    () => normalizeClientAddress({ addressTypeId: 1 } as FineractClientAddress),
    /missing addressId/
  );
});

test('normalizeClientAddresses keeps m_client_address order and primary flag per row', () => {
  const addresses = normalizeClientAddresses([
    {
      addressType: 'Permanent',
      addressId: 2,
      clientAddressId: 2,
      addressTypeId: 24,
      isActive: true,
      isPrimary: true
    } as FineractClientAddress,
    {
      addressType: 'Residential/Home',
      addressId: 1,
      clientAddressId: 1,
      addressTypeId: 23,
      isActive: true,
      isPrimary: false
    } as FineractClientAddress
  ]);

  assert.equal(addresses.length, 2);
  assert.equal(addresses[0]?.clientAddressId, 1);
  assert.equal(addresses[0]?.isPrimary, false);
  assert.equal(addresses[1]?.clientAddressId, 2);
  assert.equal(addresses[1]?.isPrimary, true);
});

test('normalizeClientAddress reads legacy primary field', () => {
  const normalized = normalizeClientAddress({
    addressId: 2,
    clientAddressId: 2,
    addressTypeId: 24,
    primary: true
  } as FineractClientAddress & { primary: boolean });

  assert.equal(normalized.isPrimary, true);
});

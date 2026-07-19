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
  normalizeClientComplianceProfile,
  normalizeOtherBankAccounts
} from './compliance-profile-normalize';

describe('normalizeOtherBankAccounts', () => {
  it('returns an empty array for nullish values', () => {
    assert.deepEqual(normalizeOtherBankAccounts(null), []);
    assert.deepEqual(normalizeOtherBankAccounts(undefined), []);
  });

  it('wraps a single account object in an array', () => {
    const accounts = normalizeOtherBankAccounts({
      bankName: 'Equity Bank',
      accountNumber: '12345'
    });
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0]?.bankName, 'Equity Bank');
    assert.equal(accounts[0]?.accountNumber, '12345');
  });

  it('normalizes lowercase postgres-style keys', () => {
    const accounts = normalizeOtherBankAccounts([
      {
        bankname: 'Stanbic',
        branchname: 'Kampala',
        accountnumber: '998877'
      }
    ]);
    assert.equal(accounts[0]?.bankName, 'Stanbic');
    assert.equal(accounts[0]?.branchName, 'Kampala');
    assert.equal(accounts[0]?.accountNumber, '998877');
  });
});

describe('normalizeClientComplianceProfile', () => {
  it('normalizes nested other bank accounts on the profile payload', () => {
    const profile = normalizeClientComplianceProfile({
      clientId: 12,
      hasOtherBankAccounts: true,
      otherBankAccounts: {
        bankName: 'Centenary',
        accountNumber: '445566'
      }
    });

    assert.equal(profile?.clientId, 12);
    assert.equal(profile?.hasOtherBankAccounts, true);
    assert.equal(profile?.otherBankAccounts?.[0]?.bankName, 'Centenary');
    assert.equal(profile?.otherBankAccounts?.[0]?.accountNumber, '445566');
  });
});

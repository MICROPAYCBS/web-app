/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildOtherBankAccountsForApi } from './compliance-profile-payload';

describe('buildOtherBankAccountsForApi', () => {
  it('assigns sequential display orders', () => {
    const accounts = buildOtherBankAccountsForApi([
      {
        id: 42,
        bankName: 'Centenary',
        branchName: 'Kampala',
        accountNumber: '12345',
        displayOrder: 1
      },
      {
        bankName: 'Stanbic',
        branchName: 'Kampala',
        accountNumber: '67890',
        displayOrder: 1
      }
    ]);

    assert.deepEqual(accounts, [
      {
        bankName: 'Centenary',
        branchName: 'Kampala',
        accountNumber: '12345',
        displayOrder: 1
      },
      {
        bankName: 'Stanbic',
        branchName: 'Kampala',
        accountNumber: '67890',
        displayOrder: 2
      }
    ]);
  });

  it('omits blank rows', () => {
    const accounts = buildOtherBankAccountsForApi([
      {
        bankName: 'Stanbic',
        branchName: '',
        accountNumber: '998877'
      }
    ]);

    assert.deepEqual(accounts, [
      {
        bankName: 'Stanbic',
        accountNumber: '998877',
        displayOrder: 1
      }
    ]);
  });
});

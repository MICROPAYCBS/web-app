/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapComplianceProfileFineractFieldErrors } from './map-compliance-profile-fineract-errors';

describe('mapComplianceProfileFineractFieldErrors', () => {
  it('maps bare bank field names to indexed form paths', () => {
    const mapped = mapComplianceProfileFineractFieldErrors([
      { field: 'bankName', message: 'Bank name is required.' },
      { field: 'accountNumber', message: 'Account number is required.' }
    ]);

    assert.equal(mapped['otherBankAccounts.0.bankName'], 'Bank name is required.');
    assert.equal(mapped['otherBankAccounts.0.accountNumber'], 'Account number is required.');
  });

  it('maps duplicate bare bank field names to successive indexes', () => {
    const mapped = mapComplianceProfileFineractFieldErrors([
      { field: 'bankName', message: 'First bank name is required.' },
      { field: 'bankName', message: 'Second bank name is required.' }
    ]);

    assert.equal(mapped['otherBankAccounts.0.bankName'], 'First bank name is required.');
    assert.equal(mapped['otherBankAccounts.1.bankName'], 'Second bank name is required.');
  });

  it('maps otherBankAccounts array errors', () => {
    const mapped = mapComplianceProfileFineractFieldErrors([
      {
        field: 'otherBankAccounts',
        message: 'Add at least one complete other bank account when this option is selected.'
      }
    ]);

    assert.equal(
      mapped.otherBankAccounts,
      'Add at least one complete other bank account when this option is selected.'
    );
  });
});

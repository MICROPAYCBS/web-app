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
  clientAccountGeneralPath,
  clientAccountListPath,
  isClientAccountSegment,
  savingsAccountSectionPath,
  savingsAccountTransactionPath
} from './client-account-links';

describe('clientAccountGeneralPath', () => {
  it('builds legacy loan account general URL', () => {
    assert.equal(clientAccountGeneralPath(42, 'loan', 99), '/clients/42/loans-accounts/99/general');
  });

  it('builds savings and share paths', () => {
    assert.equal(
      clientAccountGeneralPath('c1', 'savings', 1),
      '/clients/c1/savings-accounts/1/general'
    );
    assert.equal(
      clientAccountGeneralPath('c1', 'share', 2),
      '/clients/c1/shares-accounts/2/general'
    );
  });
});

describe('isClientAccountSegment', () => {
  it('accepts known segments only', () => {
    assert.equal(isClientAccountSegment('loans-accounts'), true);
    assert.equal(isClientAccountSegment('loans'), false);
  });
});

describe('clientAccountListPath', () => {
  it('maps product kind to client list tab', () => {
    assert.equal(clientAccountListPath(1, 'fixedDeposit'), '/clients/1/fixed-deposits');
  });
});

describe('savingsAccountTransactionPath', () => {
  it('builds transaction detail URL', () => {
    assert.equal(
      savingsAccountTransactionPath('c1', 5, 99),
      '/clients/c1/savings-accounts/5/transactions/99'
    );
  });
});

describe('savingsAccountSectionPath', () => {
  it('opens account on transactions section', () => {
    assert.equal(
      savingsAccountSectionPath('c1', 1, 'transactions'),
      '/clients/c1/savings-accounts/1/general?section=transactions'
    );
  });
});

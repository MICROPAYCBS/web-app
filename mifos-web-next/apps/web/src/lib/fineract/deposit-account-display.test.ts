/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractSavingsAccountDetail } from '@mifos/api-client';
import { depositAccountActionVisibility } from './deposit-account-display';

function accountWithStatus(code: string): FineractSavingsAccountDetail {
  return {
    id: 1,
    accountNo: '0001',
    status: { id: 1, code, value: code },
    currency: { code: 'UGX' }
  } as FineractSavingsAccountDetail;
}

describe('depositAccountActionVisibility', () => {
  it('exposes opening actions while pending', () => {
    const visibility = depositAccountActionVisibility(
      accountWithStatus('savingsAccountStatusType.submitted.and.pending.approval'),
      'fixedDeposit'
    );
    assert.equal(visibility.approve, true);
    assert.equal(visibility.reject, true);
    assert.equal(visibility.deleteAccount, true);
    assert.equal(visibility.activate, false);
    assert.equal(visibility.prematureClose, false);
  });

  it('exposes premature close and RD money movement while active', () => {
    const fd = depositAccountActionVisibility(
      accountWithStatus('savingsAccountStatusType.active'),
      'fixedDeposit'
    );
    assert.equal(fd.prematureClose, true);
    assert.equal(fd.undoActivation, true);
    assert.equal(fd.deposit, false);
    assert.equal(fd.close, false);

    const rd = depositAccountActionVisibility(
      accountWithStatus('savingsAccountStatusType.active'),
      'recurringDeposit'
    );
    assert.equal(rd.deposit, true);
    assert.equal(rd.withdrawal, true);
  });

  it('exposes matured close', () => {
    const visibility = depositAccountActionVisibility(
      accountWithStatus('savingsAccountStatusType.matured'),
      'fixedDeposit'
    );
    assert.equal(visibility.close, true);
    assert.equal(visibility.prematureClose, false);
    assert.equal(visibility.calculateInterest, true);
  });
});

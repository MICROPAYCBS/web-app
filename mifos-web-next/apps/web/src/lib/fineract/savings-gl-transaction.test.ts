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
  savingsAccountingRuleAllowsGlTransactions,
  savingsAccountStatusIsActive
} from './savings-gl-transaction';

describe('savings GL transaction eligibility', () => {
  it('requires an active savings account', () => {
    assert.equal(savingsAccountStatusIsActive({ id: 300 }), true);
    assert.equal(savingsAccountStatusIsActive({ id: 100 }), false);
    assert.equal(savingsAccountStatusIsActive(undefined), false);
  });

  it('allows cash and accrual accounting only', () => {
    assert.equal(savingsAccountingRuleAllowsGlTransactions({ id: 1 }), false);
    assert.equal(savingsAccountingRuleAllowsGlTransactions({ id: 2 }), true);
    assert.equal(savingsAccountingRuleAllowsGlTransactions({ id: 3 }), true);
    assert.equal(savingsAccountingRuleAllowsGlTransactions({ id: 4 }), true);
    assert.equal(savingsAccountingRuleAllowsGlTransactions(null), false);
  });
});

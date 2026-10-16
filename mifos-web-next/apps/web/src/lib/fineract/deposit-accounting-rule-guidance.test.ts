/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { depositAccountingRuleGuidance } from '@/lib/fineract/deposit-accounting-rule-guidance';

describe('depositAccountingRuleGuidance', () => {
  it('explains cash posting for savings, including overdraft and escheat', () => {
    const guidance = depositAccountingRuleGuidance('savings', 2);
    assert.equal(guidance?.title, 'Cash — the ledger moves with the customer balance');
    assert.ok(guidance?.points.some((point) => point.includes('overdraft portfolio')));
    assert.ok(guidance?.points.some((point) => point.includes('escheat')));
  });

  it('explains periodic accrual for a fixed deposit, including pre-closure', () => {
    const guidance = depositAccountingRuleGuidance('fixed', 3);
    assert.equal(
      guidance?.title,
      'Periodic accrual — interest hits the ledger before it is paid out'
    );
    assert.ok(guidance?.points.some((point) => point.includes('during the term')));
    assert.ok(guidance?.points.some((point) => point.includes('pre-closure')));
  });

  it('explains that a missed recurring installment is not itself a cash entry', () => {
    const guidance = depositAccountingRuleGuidance('recurring', 2);
    assert.ok(guidance?.points.some((point) => point.includes('missed installment')));
  });

  it('limits recurring accrual to deposits already received', () => {
    const guidance = depositAccountingRuleGuidance('recurring', 3);
    assert.ok(guidance?.points.some((point) => point.includes('already received')));
  });

  it('explains that no accounting leaves the ledger unchanged', () => {
    const guidance = depositAccountingRuleGuidance('savings', 1);
    assert.equal(guidance?.title, 'No ledger posting');
    assert.ok(guidance?.points.some((point) => point.includes('general ledger unchanged')));
  });

  it('returns nothing for an unknown rule', () => {
    assert.equal(depositAccountingRuleGuidance('fixed', 4), null);
    assert.equal(depositAccountingRuleGuidance('savings', undefined), null);
  });
});

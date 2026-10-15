/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loanAccountMarkAsNpaCommandSchema } from '@mifos/validation';
import {
  activeLoanNpaReasons,
  loanNpaCommandSuccess,
  loanNpaReasonName,
  loanNpaReasonNote
} from '@/lib/fineract/loan-npa';

describe('activeLoanNpaReasons', () => {
  it('keeps active values and sorts them by position', () => {
    const reasons = activeLoanNpaReasons([
      { id: 2, name: 'Fraud', position: 3, active: true },
      { id: 9, name: 'Retired', position: 1, active: false },
      { id: 1, name: 'Death of borrower', position: 1, active: true }
    ]);
    assert.deepEqual(reasons, [
      { id: 1, name: 'Death of borrower' },
      { id: 2, name: 'Fraud' }
    ]);
  });
});

describe('loanNpaCommandSuccess', () => {
  it('treats a loan id as an applied command', () => {
    const result = loanNpaCommandSuccess({ loanId: 12, commandId: 4 });
    assert.equal(result.ok, true);
    assert.equal(result.pendingChecker, undefined);
    assert.equal(result.resourceId, 12);
  });

  it('treats a command id without a loan id as awaiting approval', () => {
    const result = loanNpaCommandSuccess({ commandId: 4, rollbackTransaction: true });
    assert.equal(result.pendingChecker, true);
    assert.equal(result.commandId, 4);
    assert.equal('resourceId' in result ? result.resourceId : undefined, undefined);
  });
});

describe('loanAccountMarkAsNpaCommandSchema', () => {
  it('requires a reason and drops a blank note', () => {
    const parsed = loanAccountMarkAsNpaCommandSchema.safeParse({ npaReasonId: 3, note: '  ' });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.npaReasonId, 3);
      assert.equal(parsed.data.note, undefined);
    }
  });

  it('rejects a note longer than 500 characters', () => {
    const parsed = loanAccountMarkAsNpaCommandSchema.safeParse({
      npaReasonId: 3,
      note: 'a'.repeat(501)
    });
    assert.equal(parsed.success, false);
  });
});

describe('loan NPA display fields', () => {
  it('uses the reason name and hides a blank note', () => {
    assert.equal(loanNpaReasonName({ id: 2, name: 'Fraud' }), 'Fraud');
    assert.equal(loanNpaReasonName('  Death of borrower  '), 'Death of borrower');
    assert.equal(loanNpaReasonNote('   '), undefined);
    assert.equal(loanNpaReasonNote('Borrower confirmed fraudulent activity'), 'Borrower confirmed fraudulent activity');
  });
});

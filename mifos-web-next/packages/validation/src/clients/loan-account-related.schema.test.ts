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
  loanCollateralItemSchema,
  loanGuarantorItemSchema
} from './create-loan-account.schema';
import { clientNoteSchema } from './client-details.schema';
import {
  loanDelinquencyPauseSchema,
  loanInterestPauseSchema,
  loanOriginatorAttachSchema,
  loanTrancheEditSchema
} from './loan-account-related.schema';

describe('loan related-record write schemas', () => {
  it('accepts a loan note', () => {
    const result = clientNoteSchema.safeParse({ note: 'Follow up after disbursement.' });
    assert.equal(result.success, true);
  });

  it('rejects an empty loan note', () => {
    const result = clientNoteSchema.safeParse({ note: '   ' });
    assert.equal(result.success, false);
  });

  it('accepts collateral add fields', () => {
    const result = loanCollateralItemSchema.safeParse({
      collateralTypeId: 12,
      value: 1500,
      description: 'Title deed'
    });
    assert.equal(result.success, true);
  });

  it('requires first and last name for external guarantors', () => {
    const result = loanGuarantorItemSchema.safeParse({
      guarantorTypeId: 4,
      firstname: '',
      lastname: ''
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path[0] === 'firstname'));
      assert.ok(result.error.issues.some((issue) => issue.path[0] === 'lastname'));
    }
  });

  it('requires an entity for existing-customer guarantors', () => {
    const result = loanGuarantorItemSchema.safeParse({
      guarantorTypeId: 1
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path[0] === 'entityId'));
    }
  });

  it('accepts an interest pause range', () => {
    const result = loanInterestPauseSchema.safeParse({
      startDate: '01 September 2026',
      endDate: '15 September 2026'
    });
    assert.equal(result.success, true);
  });

  it('accepts a delinquency pause range', () => {
    const result = loanDelinquencyPauseSchema.safeParse({
      startDate: '01 September 2026',
      endDate: '15 September 2026'
    });
    assert.equal(result.success, true);
  });

  it('requires at least one tranche row', () => {
    const result = loanTrancheEditSchema.safeParse({ disbursementData: [] });
    assert.equal(result.success, false);
  });

  it('accepts expected disbursement rows', () => {
    const result = loanTrancheEditSchema.safeParse({
      disbursementData: [
        { expectedDisbursementDate: '01 October 2026', principal: 5000 },
        { id: 9, expectedDisbursementDate: '01 November 2026', principal: 2500 }
      ]
    });
    assert.equal(result.success, true);
  });

  it('accepts an originator id for attach', () => {
    const result = loanOriginatorAttachSchema.safeParse({ originatorId: 4 });
    assert.equal(result.success, true);
  });

  it('rejects a missing originator id', () => {
    const result = loanOriginatorAttachSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

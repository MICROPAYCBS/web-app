/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loanAccountAccrueCommandSchema } from '@mifos/validation';
import {
  loanAccountAccrueEligibility,
  loanAccountAccrueRequestBody
} from '@/lib/fineract/loan-account-accrue';

const periodic = { id: 3, code: 'accountingRuleType.accrual.periodic' };
const active = {
  status: { id: 300, code: 'loanStatusType.active' }
};

describe('loanAccountAccrueEligibility', () => {
  it('shows Accrue on an active periodic-accrual loan', () => {
    assert.deepEqual(loanAccountAccrueEligibility(active, periodic), {
      show: true,
      omitTillDate: false
    });
  });

  it('hides Accrue unless the product uses periodic accrual', () => {
    assert.equal(loanAccountAccrueEligibility(active, { id: 1, code: 'accountingRuleType.none' }).show, false);
    assert.equal(loanAccountAccrueEligibility(active, { id: 2, code: 'accountingRuleType.cash' }).show, false);
    assert.equal(loanAccountAccrueEligibility(active, null).show, false);
  });

  it('hides Accrue when the loan is not active, NPA, charged off, or contract-terminated', () => {
    assert.equal(
      loanAccountAccrueEligibility({ status: { id: 200 } }, periodic).show,
      false
    );
    assert.equal(loanAccountAccrueEligibility({ ...active, isNPA: true }, periodic).show, false);
    assert.equal(loanAccountAccrueEligibility({ ...active, chargedOff: true }, periodic).show, false);
    assert.equal(
      loanAccountAccrueEligibility(
        { ...active, subStatus: { id: 900, code: 'loanSubStatusType.contractTermination' } },
        periodic
      ).show,
      false
    );
  });

  it('hides Accrue on a progressive loan that posts compounding as transactions', () => {
    assert.equal(
      loanAccountAccrueEligibility(
        {
          ...active,
          loanScheduleType: { id: 2, code: 'PROGRESSIVE', value: 'Progressive' },
          interestRecalculationData: { isCompoundingToBePostedAsTransaction: true }
        },
        periodic
      ).show,
      false
    );
  });

  it('offers Accrue without a till date when a cumulative loan posts compounding income', () => {
    assert.deepEqual(
      loanAccountAccrueEligibility(
        {
          ...active,
          loanScheduleType: { id: 1, code: 'CUMULATIVE', value: 'Cumulative' },
          interestRecalculationData: { isCompoundingToBePostedAsTransaction: true }
        },
        periodic
      ),
      { show: true, omitTillDate: true }
    );
  });
});

describe('loanAccountAccrueRequestBody', () => {
  it('sends an empty body through the business date', () => {
    assert.deepEqual(
      loanAccountAccrueRequestBody({
        tillDate: '02 October 2026',
        businessDate: '02 October 2026',
        omitTillDate: false
      }),
      { ok: true, body: {} }
    );
  });

  it('sends an earlier till date with locale and date format', () => {
    assert.deepEqual(
      loanAccountAccrueRequestBody({
        tillDate: '01 October 2026',
        businessDate: '02 October 2026',
        omitTillDate: false
      }),
      {
        ok: true,
        body: {
          locale: 'en',
          dateFormat: 'dd MMMM yyyy',
          tillDate: '01 October 2026'
        }
      }
    );
  });

  it('rejects a till date after the business date', () => {
    const result = loanAccountAccrueRequestBody({
      tillDate: '03 October 2026',
      businessDate: '02 October 2026',
      omitTillDate: false
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.field, 'tillDate');
      assert.match(result.message, /business date/i);
    }
  });

  it('ignores till date when compounding income is posted', () => {
    assert.deepEqual(
      loanAccountAccrueRequestBody({
        tillDate: '01 October 2026',
        businessDate: '02 October 2026',
        omitTillDate: true
      }),
      { ok: true, body: {} }
    );
  });
});

describe('loanAccountAccrueCommandSchema', () => {
  it('accepts an empty body and an optional till date', () => {
    assert.equal(loanAccountAccrueCommandSchema.safeParse({}).success, true);
    const parsed = loanAccountAccrueCommandSchema.safeParse({ tillDate: '02 October 2026' });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.tillDate, '02 October 2026');
    }
  });
});

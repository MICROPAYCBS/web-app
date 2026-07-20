/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeGlAccountLedgerResponse } from './gl-account-ledger-normalize';
import { buildGlAccountLedgerQueryParams } from './gl-account-ledger-query';

describe('normalizeGlAccountLedgerResponse', () => {
  const base = {
    glAccountId: 15,
    glCode: '100001',
    glAccountName: 'Cash',
    officeId: 1,
    officeName: 'Head Office',
    departmentId: 1,
    departmentName: 'IT',
    currencyCode: 'UGX',
    startDate: [2026, 6, 16],
    endDate: [2026, 7, 16],
    summary: {
      openingBalance: 0,
      totalDebit: 140000,
      totalCredit: 0,
      closingBalance: 140000,
      lastUpdated: '2026-07-14T09:12:00Z'
    }
  };

  it('keeps entries when entryDate is a Fineract LocalDate array', () => {
    const ledger = normalizeGlAccountLedgerResponse(
      {
        ...base,
        entries: [
          {
            entryDate: [2026, 7, 14],
            transactionId: 'J14',
            description: 'Deposit',
            source: 'Manual',
            debit: 140000,
            credit: 0,
            runningBalance: 140000
          }
        ]
      },
      15
    );
    assert.ok(ledger);
    assert.equal(ledger.entries.length, 1);
    assert.equal(ledger.entries[0]?.entryDate, '2026-07-14');
    assert.equal(ledger.entries[0]?.transactionId, 'J14');
    assert.equal(ledger.summary.totalDebit, 140000);
  });

  it('still accepts ISO string entryDate', () => {
    const ledger = normalizeGlAccountLedgerResponse(
      {
        ...base,
        entries: [
          {
            entryDate: '2026-07-10',
            transactionId: 'J10',
            source: 'Manual',
            debit: 100,
            credit: 0,
            runningBalance: 100
          }
        ]
      },
      15
    );
    assert.equal(ledger?.entries[0]?.entryDate, '2026-07-10');
  });
});

describe('buildGlAccountLedgerQueryParams', () => {
  it('requires office, currency, and dates; maps to yyyy-MM-dd', () => {
    assert.equal(
      buildGlAccountLedgerQueryParams({
        startDate: '',
        endDate: '01 July 2026',
        officeId: '1',
        currencyCode: 'UGX'
      }),
      null
    );
    assert.deepEqual(
      buildGlAccountLedgerQueryParams({
        startDate: '01 June 2026',
        endDate: '01 July 2026',
        officeId: '1',
        currencyCode: 'ugx'
      }),
      {
        startDate: '2026-06-01',
        endDate: '2026-07-01',
        officeId: '1',
        currencyCode: 'UGX'
      }
    );
  });

  it('includes departmentId 0 for unassigned and omits when unset', () => {
    assert.deepEqual(
      buildGlAccountLedgerQueryParams({
        startDate: '2026-07-01',
        endDate: '2026-07-16',
        officeId: '1',
        currencyCode: 'UGX',
        departmentId: '0'
      }),
      {
        startDate: '2026-07-01',
        endDate: '2026-07-16',
        officeId: '1',
        currencyCode: 'UGX',
        departmentId: '0'
      }
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        buildGlAccountLedgerQueryParams({
          startDate: '2026-07-01',
          endDate: '2026-07-16',
          officeId: '1',
          currencyCode: 'UGX'
        }) ?? {},
        'departmentId'
      ),
      false
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        buildGlAccountLedgerQueryParams({
          startDate: '2026-07-01',
          endDate: '2026-07-16',
          officeId: '1',
          currencyCode: 'UGX',
          departmentId: ''
        }) ?? {},
        'departmentId'
      ),
      false
    );
  });
});

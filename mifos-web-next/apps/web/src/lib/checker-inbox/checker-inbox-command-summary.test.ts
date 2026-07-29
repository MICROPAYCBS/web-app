/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkerCommandHighlights } from './checker-inbox-command-summary';

describe('checkerCommandHighlights', () => {
  it('prefers identity fields for CREATE CLIENT', () => {
    const highlights = checkerCommandHighlights(
      JSON.stringify({
        firstname: 'Ada',
        lastname: 'Byron',
        officeId: 1,
        mobileNo: '0700123456',
        submittedOnDate: '11 July 2026',
        externalId: 'EXT-100',
        amount: 999,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy'
      }),
      { actionName: 'CREATE', entityName: 'CLIENT' }
    );

    assert.equal(highlights.length, 6);
    assert.ok(highlights[0]?.toLowerCase().includes('firstname'));
    assert.ok(highlights.some((line) => line.toLowerCase().includes('mobile')));
    assert.ok(!highlights.some((line) => line.toLowerCase().includes('amount')));
  });

  it('prefers journal fields for JOURNALENTRY', () => {
    const highlights = checkerCommandHighlights(
      JSON.stringify({
        comments: 'Salary accrual',
        transactionDate: '11 July 2026',
        currencyCode: 'UGX',
        officeId: 1,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        amount: 999
      }),
      { actionName: 'CREATE', entityName: 'JOURNALENTRY' }
    );

    assert.ok(highlights.length >= 4);
    assert.ok(highlights.length <= 6);
    assert.ok(highlights[0]?.toLowerCase().includes('comments'));
    assert.ok(highlights.some((line) => line.toLowerCase().includes('currency')));
    assert.ok(highlights.some((line) => line.toLowerCase().includes('transaction date')));
  });

  it('keeps loan-biased defaults for other commands', () => {
    const highlights = checkerCommandHighlights(
      JSON.stringify({
        firstname: 'Ada',
        amount: 500,
        note: 'approve',
        locale: 'en'
      })
    );

    assert.ok(highlights[0]?.toLowerCase().includes('amount'));
    assert.ok(highlights.length <= 4);
  });
});

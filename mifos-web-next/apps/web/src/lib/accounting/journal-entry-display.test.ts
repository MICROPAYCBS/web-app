/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { backfillJournalEntryGlAccountCode } from './journal-entry-display';

describe('backfillJournalEntryGlAccountCode', () => {
  it('prefixes with branch and department when officeId is present', () => {
    assert.equal(
      backfillJournalEntryGlAccountCode({
        glAccountCode: '100001',
        officeId: 1,
        departmentId: 2
      }),
      '01-02-100001'
    );
  });

  it('uses 00 department segment when department is missing or zero', () => {
    assert.equal(
      backfillJournalEntryGlAccountCode({
        glAccountCode: '100001',
        officeId: 1
      }),
      '01-00-100001'
    );
    assert.equal(
      backfillJournalEntryGlAccountCode({
        glAccountCode: '100001',
        officeId: 1,
        departmentId: 0
      }),
      '01-00-100001'
    );
  });

  it('leaves the raw code unchanged without a usable officeId', () => {
    assert.equal(
      backfillJournalEntryGlAccountCode({
        glAccountCode: '100001'
      }),
      '100001'
    );
    assert.equal(
      backfillJournalEntryGlAccountCode({
        glAccountCode: '100001',
        officeId: 0
      }),
      '100001'
    );
  });
});

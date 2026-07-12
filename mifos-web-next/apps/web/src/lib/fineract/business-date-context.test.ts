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
  hasConfiguredBusinessDate,
  isTransactionDateBackdated,
  isTransactionDateLocked,
  resolveLoanApprovalDefaultDate,
  resolveLoanDisbursementDefaultDate,
  resolveTransactionDate
} from './business-date-context';

describe('hasConfiguredBusinessDate', () => {
  it('returns true when enabled with a date', () => {
    assert.equal(hasConfiguredBusinessDate({ enabled: true, date: '10 July 2026' }), true);
  });

  it('returns false when disabled or missing date', () => {
    assert.equal(hasConfiguredBusinessDate({ enabled: false, date: '10 July 2026' }), false);
    assert.equal(hasConfiguredBusinessDate({ enabled: true }), false);
  });
});

describe('isTransactionDateLocked', () => {
  it('is always false so transaction dates remain editable for backdating', () => {
    assert.equal(isTransactionDateLocked({ enabled: true, date: '10 July 2026' }), false);
  });
});

describe('isTransactionDateBackdated', () => {
  it('detects dates before the organisation business date', () => {
    assert.equal(isTransactionDateBackdated('8 July 2026', '10 July 2026'), true);
    assert.equal(isTransactionDateBackdated('10 July 2026', '10 July 2026'), false);
    assert.equal(isTransactionDateBackdated('11 July 2026', '10 July 2026'), false);
  });
});

describe('resolveTransactionDate', () => {
  it('prefers the configured business date', () => {
    assert.equal(
      resolveTransactionDate({ enabled: true, date: '10 July 2026' }, '9 July 2026'),
      '10 July 2026'
    );
  });

  it('falls back when no business date is set', () => {
    assert.equal(resolveTransactionDate({ enabled: true }, '9 July 2026'), '9 July 2026');
  });
});

describe('resolveLoanApprovalDefaultDate', () => {
  it('prefers business date over submitted date', () => {
    assert.equal(
      resolveLoanApprovalDefaultDate(
        { enabled: true, date: '10 July 2026' },
        '5 July 2026'
      ),
      '10 July 2026'
    );
  });

  it('uses submitted date when business date is not configured', () => {
    assert.equal(
      resolveLoanApprovalDefaultDate({ enabled: true }, '5 July 2026'),
      '5 July 2026'
    );
  });
});

describe('resolveLoanDisbursementDefaultDate', () => {
  it('prefers business date over approval date', () => {
    assert.equal(
      resolveLoanDisbursementDefaultDate(
        { enabled: true, date: '10 July 2026' },
        '8 July 2026'
      ),
      '10 July 2026'
    );
  });

  it('uses approval date when business date is not configured', () => {
    assert.equal(
      resolveLoanDisbursementDefaultDate({ enabled: true }, '8 July 2026'),
      '8 July 2026'
    );
  });
});

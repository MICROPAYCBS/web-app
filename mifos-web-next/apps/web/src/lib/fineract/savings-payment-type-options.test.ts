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
  paymentTypeOptionsIncludingSelected,
  resolvePaymentTypeId,
  userSelectablePaymentTypeOptions
} from './savings-payment-type-options';

describe('resolvePaymentTypeId', () => {
  it('returns the first valid positive id', () => {
    assert.equal(resolvePaymentTypeId(undefined, '', '2', 3), 2);
    assert.equal(resolvePaymentTypeId(4), 4);
  });
});

describe('paymentTypeOptionsIncludingSelected', () => {
  const options = [
    { id: 1, name: 'Cash', isSystemDefined: true },
    { id: 2, name: 'Cheque', isSystemDefined: false }
  ];

  it('excludes system-defined types when nothing is selected', () => {
    assert.deepEqual(userSelectablePaymentTypeOptions(options), [{ id: 2, name: 'Cheque' }]);
  });

  it('includes the selected system-defined payment type', () => {
    assert.deepEqual(paymentTypeOptionsIncludingSelected(options, 1), [
      { id: 1, name: 'Cash' },
      { id: 2, name: 'Cheque' }
    ]);
  });

  it('does not duplicate when the selected type is already selectable', () => {
    assert.deepEqual(paymentTypeOptionsIncludingSelected(options, 2), [{ id: 2, name: 'Cheque' }]);
  });
});

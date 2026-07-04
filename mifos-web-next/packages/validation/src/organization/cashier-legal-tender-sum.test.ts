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
  amountsEqualForCurrency,
  findDuplicateLegalTenderIds,
  hasPositiveLegalTenderQuantity,
  sumLegalTenderLines
} from './cashier-legal-tender-sum';

describe('cashier legal tender sum', () => {
  const masters = new Map([
    [6, { id: 6, value: 50_000 }],
    [7, { id: 7, value: 0.25 }]
  ]);

  it('sums UGX lines with zero decimal places', () => {
    const total = sumLegalTenderLines([{ legalTenderId: 6, quantity: 100 }], masters);
    assert.equal(amountsEqualForCurrency(total, 5_000_000, 0), true);
  });

  it('sums USD coin lines with two decimal places', () => {
    const total = sumLegalTenderLines([{ legalTenderId: 7, quantity: 4 }], masters);
    assert.equal(amountsEqualForCurrency(total, 1, 2), true);
  });

  it('rejects mismatched totals', () => {
    const total = sumLegalTenderLines([{ legalTenderId: 6, quantity: 99 }], masters);
    assert.equal(amountsEqualForCurrency(total, 5_000_000, 0), false);
  });

  it('detects duplicate legal tender ids', () => {
    assert.deepEqual(
      findDuplicateLegalTenderIds([
        { legalTenderId: 6, quantity: 1 },
        { legalTenderId: 6, quantity: 2 }
      ]),
      [6]
    );
  });

  it('requires at least one positive quantity', () => {
    assert.equal(hasPositiveLegalTenderQuantity([{ legalTenderId: 6, quantity: 0 }]), false);
    assert.equal(hasPositiveLegalTenderQuantity([{ legalTenderId: 6, quantity: 1 }]), true);
  });
});

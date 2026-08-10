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
  buildProductChargesPayload,
  productChargeAmountsFromTemplate,
  pruneProductChargeAmounts
} from './product-charge-links';

describe('buildProductChargesPayload', () => {
  it('includes amount only when override is set', () => {
    assert.deepEqual(
      buildProductChargesPayload([10, 11], { '11': 1.5 }),
      [{ id: 10 }, { id: 11, amount: 1.5 }]
    );
  });

  it('ignores non-positive overrides', () => {
    assert.deepEqual(buildProductChargesPayload([10], { '10': 0 }), [{ id: 10 }]);
  });
});

describe('productChargeAmountsFromTemplate', () => {
  it('prefills when product amount differs from definition', () => {
    assert.deepEqual(
      productChargeAmountsFromTemplate(
        [{ id: 11, amount: 1.5 }],
        [{ id: 11, amount: 10, useChargeTiers: false }]
      ),
      { '11': 1.5 }
    );
  });

  it('omits when amounts match (inherit definition)', () => {
    assert.deepEqual(
      productChargeAmountsFromTemplate([{ id: 10, amount: 25 }], [{ id: 10, amount: 25 }]),
      {}
    );
  });

  it('omits tiered charges', () => {
    assert.deepEqual(
      productChargeAmountsFromTemplate(
        [{ id: 12, amount: 0 }],
        [{ id: 12, amount: 0, useChargeTiers: true }]
      ),
      {}
    );
  });
});

describe('pruneProductChargeAmounts', () => {
  it('keeps overrides only for selected ids', () => {
    assert.deepEqual(pruneProductChargeAmounts([11], { '10': 2, '11': 3 }), { '11': 3 });
  });
});

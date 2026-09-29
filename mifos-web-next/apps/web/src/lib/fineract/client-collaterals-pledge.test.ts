/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clientPledgeOptionsFromResponse } from '@/lib/fineract/client-collateral-display';

describe('client pledge collateral options', () => {
  it('reads the client collateral id from the customer template', () => {
    const options = clientPledgeOptionsFromResponse([
      {
        collateralId: 14,
        name: 'Land title',
        basePrice: 10000000,
        pctToBase: 80,
        quantity: 1
      }
    ]);
    assert.equal(options.length, 1);
    assert.equal(options[0]?.collateralId, 14);
    assert.equal(options[0]?.name, 'Land title');
    assert.equal(options[0]?.value, 10000000);
    assert.equal(options[0]?.pctToBase, 80);
    assert.equal(options[0]?.quantity, 1);
  });
});

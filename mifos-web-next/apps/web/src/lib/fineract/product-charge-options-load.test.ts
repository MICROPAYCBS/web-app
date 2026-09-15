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
  interpretProductChargeOptionsResult,
  PRODUCT_CHARGE_OPTIONS_FALLBACK_ERROR,
  pruneProductChargeIds
} from './product-charge-options';

describe('interpretProductChargeOptionsResult', () => {
  it('does not treat a failed fetch as an empty option list', () => {
    const failed = interpretProductChargeOptionsResult({ ok: false, message: '' });
    assert.equal(failed.ok, false);
    if (!failed.ok) {
      assert.equal(failed.message, PRODUCT_CHARGE_OPTIONS_FALLBACK_ERROR);
    }
  });

  it('only prunes selected charge ids after a successful load', () => {
    const selected = [10, 20];
    const failed = interpretProductChargeOptionsResult({ ok: false, message: 'Offline' });
    assert.equal(failed.ok, false);
    assert.deepEqual(selected, [10, 20]);

    const loaded = interpretProductChargeOptionsResult({
      ok: true,
      chargeOptions: [{ id: 10 }],
      penaltyOptions: []
    });
    assert.equal(loaded.ok, true);
    if (loaded.ok) {
      assert.deepEqual(
        pruneProductChargeIds(selected, loaded.chargeOptions, loaded.penaltyOptions),
        [10]
      );
    }
  });
});

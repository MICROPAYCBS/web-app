/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest';
import {
  filterChargeOptionsByCurrency,
  filterTemplateChargeOptionsByCurrency,
  pruneProductChargeIds
} from './product-charge-options';

describe('product charge options', () => {
  it('filters charges by currency code', () => {
    const options = [
      { id: 1, name: 'UGX fee', currency: { code: 'UGX' } },
      { id: 2, name: 'USD fee', currency: { code: 'USD' } }
    ];
    expect(filterChargeOptionsByCurrency(options, 'ugx')).toEqual([options[0]]);
  });

  it('prunes charge ids not in available options', () => {
    expect(
      pruneProductChargeIds(
        [1, 2, 3],
        [{ id: 1 }, { id: 2 }],
        [{ id: 3 }]
      )
    ).toEqual([1, 2, 3]);
    expect(pruneProductChargeIds([1, 99], [{ id: 1 }], [])).toEqual([1]);
  });

  it('clears charge options when template has no currency', () => {
    const template = {
      chargeOptions: [{ id: 1, currency: { code: 'UGX' } }],
      penaltyOptions: [{ id: 2, currency: { code: 'USD' } }]
    };
    expect(filterTemplateChargeOptionsByCurrency(template)).toEqual({
      chargeOptions: [],
      penaltyOptions: []
    });
  });

  it('filters template charge options by product currency', () => {
    const template = {
      currencyCode: 'UGX',
      chargeOptions: [
        { id: 1, currency: { code: 'UGX' } },
        { id: 2, currency: { code: 'USD' } }
      ],
      penaltyOptions: [{ id: 3, currency: { code: 'UGX' } }]
    };
    expect(filterTemplateChargeOptionsByCurrency(template)).toEqual({
      currencyCode: 'UGX',
      chargeOptions: [{ id: 1, currency: { code: 'UGX' } }],
      penaltyOptions: [{ id: 3, currency: { code: 'UGX' } }]
    });
  });
});

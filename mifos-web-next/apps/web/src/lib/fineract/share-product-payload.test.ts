/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UpsertShareProductInput } from '@mifos/validation';
import { buildShareProductPayload } from './share-product-payload';

function minimalDraft(
  overrides: Partial<UpsertShareProductInput> = {}
): UpsertShareProductInput {
  return {
    details: { name: 'Test Shares', shortName: 'TSH', description: 'Test share product', ...overrides.details },
    currency: {
      currencyCode: 'USD',
      digitsAfterDecimal: 2,
      inMultiplesOf: 1,
      ...overrides.currency
    },
    terms: {
      totalShares: 1000,
      sharesIssued: 500,
      unitPrice: 10,
      shareCapital: 5000,
      ...overrides.terms
    },
    settings: {
      nominalShares: 10,
      minimumActivePeriodForDividends: 30,
      enableLockinPeriod: false,
      allowDividendCalculationForInactiveClients: false,
      ...overrides.settings
    },
    marketPrice: { marketPricePeriods: [], ...overrides.marketPrice },
    charges: { chargeIds: [], ...overrides.charges },
    accounting: { accountingRule: 1, ...overrides.accounting }
  };
}

describe('buildShareProductPayload', () => {
  it('omits top-level dateFormat and sends sharesIssued', () => {
    const payload = buildShareProductPayload(minimalDraft());

    assert.equal('dateFormat' in payload, false);
    assert.equal('totalSharesIssued' in payload, false);
    assert.equal(payload.sharesIssued, 500);
    assert.equal(payload.locale, 'en');
  });

  it('omits lock-in fields when disabled', () => {
    const payload = buildShareProductPayload(minimalDraft());

    assert.equal('lockinPeriodFrequency' in payload, false);
    assert.equal('lockinPeriodFrequencyType' in payload, false);
    assert.equal('enableLockinPeriod' in payload, false);
  });

  it('omits GL accounts when accounting is none', () => {
    const payload = buildShareProductPayload(minimalDraft());

    assert.equal('shareReferenceId' in payload, false);
    assert.equal('incomeFromFeeAccountId' in payload, false);
  });

  it('maps charges to chargesSelected', () => {
    const payload = buildShareProductPayload(
      minimalDraft({ charges: { chargeIds: [2, 5] } })
    );

    assert.deepEqual(payload.chargesSelected, [{ id: 2 }, { id: 5 }]);
    assert.equal('charges' in payload, false);
  });

  it('omits chargesSelected when no charges selected', () => {
    const payload = buildShareProductPayload(minimalDraft());

    assert.equal('chargesSelected' in payload, false);
  });

  it('sends market price rows as marketPricePeriods with nested dateFormat only', () => {
    const payload = buildShareProductPayload(
      minimalDraft({
        marketPrice: {
          marketPricePeriods: [{ fromDate: '01 January 2026', shareValue: 25 }]
        }
      })
    );

    assert.equal('dateFormat' in payload, false);
    assert.ok(Array.isArray(payload.marketPricePeriods));
    const row = (payload.marketPricePeriods as Record<string, unknown>[])[0];
    assert.equal(row.dateFormat, 'dd MMMM yyyy');
    assert.equal(row.fromDate, '01 January 2026');
    assert.equal('marketPrice' in payload, false);
  });

  it('omits inMultiplesOf when unset', () => {
    const payload = buildShareProductPayload(
      minimalDraft({ currency: { currencyCode: 'USD', digitsAfterDecimal: 2, inMultiplesOf: undefined } })
    );

    assert.equal('inMultiplesOf' in payload, false);
  });

  it('omits marketPricePeriods when empty', () => {
    const payload = buildShareProductPayload(minimalDraft());

    assert.equal('marketPricePeriods' in payload, false);
  });
});

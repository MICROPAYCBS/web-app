/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  DepositProductDetail,
  LoanProductDetail,
  SavingsProductDetail
} from '@mifos/api-client';
import { depositProductSectionIds } from './deposit-product-sections';
import { loanProductSectionIds } from './loan-product-sections';
import { savingsProductSectionIds } from './savings-product-sections';

const mappingRow = { paymentType: { id: 1, name: 'Cash' } };
const feeRow = { charge: { id: 2, name: 'Fee' } };
const penaltyRow = { charge: { id: 3, name: 'Penalty' } };

describe('product mapping nav sections', () => {
  it('includes each loan mapping id only when that array has rows', () => {
    const none = loanProductSectionIds({} as LoanProductDetail, 'loan');
    assert.equal(none.includes('channelMapping'), false);
    assert.equal(none.includes('feeGlMappings'), false);
    assert.equal(none.includes('penaltyGlMappings'), false);

    const all = loanProductSectionIds(
      {
        paymentChannelToFundSourceMappings: [mappingRow],
        feeToIncomeAccountMappings: [feeRow],
        penaltyToIncomeAccountMappings: [penaltyRow]
      } as LoanProductDetail,
      'loan'
    );
    assert.equal(all.includes('channelMapping'), true);
    assert.equal(all.includes('feeGlMappings'), true);
    assert.equal(all.includes('penaltyGlMappings'), true);

    const channelOnly = loanProductSectionIds(
      { paymentChannelToFundSourceMappings: [mappingRow] } as LoanProductDetail,
      'loan'
    );
    assert.equal(channelOnly.includes('channelMapping'), true);
    assert.equal(channelOnly.includes('feeGlMappings'), false);
    assert.equal(channelOnly.includes('penaltyGlMappings'), false);
  });

  it('includes each savings mapping id only when that array has rows', () => {
    const none = savingsProductSectionIds({} as SavingsProductDetail);
    assert.equal(none.includes('channelMapping'), false);
    assert.equal(none.includes('feeGlMappings'), false);
    assert.equal(none.includes('penaltyGlMappings'), false);

    const feeOnly = savingsProductSectionIds({
      feeToIncomeAccountMappings: [feeRow]
    } as SavingsProductDetail);
    assert.equal(feeOnly.includes('channelMapping'), false);
    assert.equal(feeOnly.includes('feeGlMappings'), true);
    assert.equal(feeOnly.includes('penaltyGlMappings'), false);
  });

  it('includes each deposit mapping id only when that array has rows', () => {
    const none = depositProductSectionIds({} as DepositProductDetail);
    assert.equal(none.includes('channelMapping'), false);
    assert.equal(none.includes('feeGlMappings'), false);
    assert.equal(none.includes('penaltyGlMappings'), false);

    const penaltyOnly = depositProductSectionIds({
      penaltyToIncomeAccountMappings: [penaltyRow]
    } as DepositProductDetail);
    assert.equal(penaltyOnly.includes('channelMapping'), false);
    assert.equal(penaltyOnly.includes('feeGlMappings'), false);
    assert.equal(penaltyOnly.includes('penaltyGlMappings'), true);
  });
});

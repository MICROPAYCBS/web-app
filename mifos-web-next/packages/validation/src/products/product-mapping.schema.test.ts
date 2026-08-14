/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { loanProductMappingsStepSchema } from './loan-product.schema';
import {
  CHARGE_REQUIRED_MESSAGE,
  DUPLICATE_CHARGE_MAPPING_MESSAGE,
  DUPLICATE_PAYMENT_CHANNEL_MAPPING_MESSAGE,
  FUND_SOURCE_REQUIRED_MESSAGE,
  INCOME_ACCOUNT_REQUIRED_MESSAGE,
  PAYMENT_TYPE_REQUIRED_MESSAGE,
  refineProductMappingUniqueness
} from './product-mapping.schema';

function uniquenessIssues(data: Parameters<typeof refineProductMappingUniqueness>[0]) {
  const schema = z.object({}).passthrough().superRefine((value, ctx) => {
    refineProductMappingUniqueness(value, ctx);
  });
  const result = schema.safeParse(data);
  return result.success ? [] : result.error.issues;
}

describe('refineProductMappingUniqueness', () => {
  it('rejects duplicate payment channels', () => {
    const issues = uniquenessIssues({
      paymentChannelToFundSourceMappings: [
        { paymentTypeId: 1, fundSourceAccountId: 10 },
        { paymentTypeId: 1, fundSourceAccountId: 11 }
      ]
    });
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.message, DUPLICATE_PAYMENT_CHANNEL_MAPPING_MESSAGE);
    assert.deepEqual(issues[0]?.path, ['paymentChannelToFundSourceMappings', 1, 'paymentTypeId']);
  });

  it('rejects duplicate fee charges', () => {
    const issues = uniquenessIssues({
      feeToIncomeAccountMappings: [
        { chargeId: 4, incomeAccountId: 20 },
        { chargeId: 4, incomeAccountId: 21 }
      ]
    });
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.message, DUPLICATE_CHARGE_MAPPING_MESSAGE);
    assert.deepEqual(issues[0]?.path, ['feeToIncomeAccountMappings', 1, 'chargeId']);
  });

  it('rejects duplicate penalty charges', () => {
    const issues = uniquenessIssues({
      penaltyToIncomeAccountMappings: [
        { chargeId: 8, incomeAccountId: 30 },
        { chargeId: 8, incomeAccountId: 31 }
      ]
    });
    assert.equal(issues[0]?.message, DUPLICATE_CHARGE_MAPPING_MESSAGE);
  });

  it('accepts distinct ids', () => {
    const issues = uniquenessIssues({
      paymentChannelToFundSourceMappings: [
        { paymentTypeId: 1, fundSourceAccountId: 10 },
        { paymentTypeId: 2, fundSourceAccountId: 10 }
      ],
      feeToIncomeAccountMappings: [
        { chargeId: 4, incomeAccountId: 20 },
        { chargeId: 5, incomeAccountId: 20 }
      ]
    });
    assert.equal(issues.length, 0);
  });

  it('does not unique-fail two empty draft rows', () => {
    const issues = uniquenessIssues({
      paymentChannelToFundSourceMappings: [
        { paymentTypeId: 0, fundSourceAccountId: 0 },
        { paymentTypeId: 0, fundSourceAccountId: 0 }
      ],
      feeToIncomeAccountMappings: [
        { chargeId: 0, incomeAccountId: 0 },
        { chargeId: 0, incomeAccountId: 0 }
      ]
    });
    assert.equal(issues.length, 0);
  });
});

describe('loanProductMappingsStepSchema uniqueness', () => {
  it('fails when the same payment channel is mapped twice', () => {
    const parsed = loanProductMappingsStepSchema.safeParse({
      paymentChannelToFundSourceMappings: [
        { paymentTypeId: 1, fundSourceAccountId: 10 },
        { paymentTypeId: 1, fundSourceAccountId: 11 }
      ]
    });
    assert.equal(parsed.success, false);
    if (parsed.success) {
      return;
    }
    assert.ok(
      parsed.error.issues.some(
        (issue) => issue.message === DUPLICATE_PAYMENT_CHANNEL_MAPPING_MESSAGE
      )
    );
  });

  it('accepts distinct payment channels and charges', () => {
    const parsed = loanProductMappingsStepSchema.safeParse({
      paymentChannelToFundSourceMappings: [
        { paymentTypeId: 1, fundSourceAccountId: 10 },
        { paymentTypeId: 2, fundSourceAccountId: 11 }
      ],
      feeToIncomeAccountMappings: [{ chargeId: 4, incomeAccountId: 20 }],
      penaltyToIncomeAccountMappings: [{ chargeId: 9, incomeAccountId: 21 }]
    });
    assert.equal(parsed.success, true);
  });

  it('rejects an empty channel mapping row', () => {
    const parsed = loanProductMappingsStepSchema.safeParse({
      paymentChannelToFundSourceMappings: [{ paymentTypeId: 0, fundSourceAccountId: 0 }]
    });
    assert.equal(parsed.success, false);
    if (parsed.success) {
      return;
    }
    const messages = parsed.error.issues.map((issue) => issue.message);
    assert.ok(messages.includes(PAYMENT_TYPE_REQUIRED_MESSAGE));
    assert.ok(messages.includes(FUND_SOURCE_REQUIRED_MESSAGE));
  });

  it('rejects a half-filled fee mapping row', () => {
    const parsed = loanProductMappingsStepSchema.safeParse({
      feeToIncomeAccountMappings: [{ chargeId: 4, incomeAccountId: 0 }]
    });
    assert.equal(parsed.success, false);
    if (parsed.success) {
      return;
    }
    assert.ok(
      parsed.error.issues.some((issue) => issue.message === INCOME_ACCOUNT_REQUIRED_MESSAGE)
    );
    assert.equal(
      parsed.error.issues.some((issue) => issue.message === CHARGE_REQUIRED_MESSAGE),
      false
    );
  });
});

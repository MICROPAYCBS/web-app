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
  productDraftHasUnsavedChanges,
  sanitizeProductDraftAccountingMappings
} from './product-draft-compare';

type SampleDraft = {
  details: { name: string; shortName: string };
  accounting: {
    feeToIncomeAccountMappings?: { chargeId: number; incomeAccountId: number }[];
  };
};

function sampleDraft(): SampleDraft {
  return {
    details: { name: 'Savings', shortName: 'SAV' },
    accounting: { feeToIncomeAccountMappings: [] }
  };
}

describe('productDraftHasUnsavedChanges', () => {
  it('returns false when sanitized drafts match', () => {
    const baseline = sampleDraft();
    const current = structuredClone(baseline);

    assert.equal(
      productDraftHasUnsavedChanges(
        current,
        baseline,
        sanitizeProductDraftAccountingMappings
      ),
      false
    );
  });

  it('returns true when a field changes', () => {
    const baseline = sampleDraft();
    const current = {
      ...structuredClone(baseline),
      details: { ...baseline.details, name: 'Updated savings' }
    };

    assert.equal(
      productDraftHasUnsavedChanges(
        current,
        baseline,
        sanitizeProductDraftAccountingMappings
      ),
      true
    );
  });
});

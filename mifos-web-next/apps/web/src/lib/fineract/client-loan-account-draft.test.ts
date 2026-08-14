/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from 'vitest';
import { loanAccountDraftFromTemplate } from '@/lib/fineract/client-loan-account-draft';

describe('loanAccountDraftFromTemplate', () => {
  it('defaults term and repayment units from the product template', () => {
    const draft = loanAccountDraftFromTemplate(
      {
        product: { id: 3, name: 'Term loan' },
        loanTermFrequency: 12,
        loanTermFrequencyType: { id: 2, value: 'Months' },
        numberOfRepayments: 12,
        repaymentEvery: 1,
        repaymentFrequencyType: { id: 2, value: 'Months' },
        principal: 200_000,
        currency: { code: 'UGX', name: 'Ugandan Shilling' }
      },
      '14 August 2026'
    );

    expect(draft.loanTermFrequencyType).toBe(2);
    expect(draft.repaymentFrequencyType).toBe(2);
    expect(draft.loanTermFrequency).toBe(12);
    expect(draft.submittedOnDate).toBe('14 August 2026');
    expect(draft.expectedDisbursementDate).toBe('14 August 2026');
  });

  it('falls repayment interval unit back to the loan term unit', () => {
    const draft = loanAccountDraftFromTemplate({
      product: { id: 3, name: 'Term loan' },
      loanTermFrequency: 6,
      loanTermFrequencyType: { id: 2, value: 'Months' },
      numberOfRepayments: 6,
      repaymentEvery: 1,
      principal: 100_000,
      currency: { code: 'UGX', name: 'Ugandan Shilling' }
    });

    expect(draft.loanTermFrequencyType).toBe(2);
    expect(draft.repaymentFrequencyType).toBe(2);
  });
});

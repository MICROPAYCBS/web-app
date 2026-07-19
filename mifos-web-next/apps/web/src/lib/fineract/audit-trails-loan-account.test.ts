/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractAuditTrailListItem } from '@mifos/api-client';
import { filterAuditTrailsForLoanAccount } from '@/lib/fineract/loan-account-pending-checker-filters';

describe('filterAuditTrailsForLoanAccount', () => {
  it('keeps only LOAN audits for the requested account', () => {
    const audits: FineractAuditTrailListItem[] = [
      { id: 1, resourceId: 15, entityName: 'LOAN' },
      { id: 2, resourceId: 16, entityName: 'LOAN' },
      { id: 3, resourceId: 15, entityName: 'LOANCHARGE' }
    ];

    const filtered = filterAuditTrailsForLoanAccount(audits, 15);
    assert.deepEqual(
      filtered.map((item) => item.id),
      [1]
    );
  });
});

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractAuditTrailListItem } from '@mifos/api-client';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterAuditTrailsForSavingsTransaction } from './audit-trails';

describe('filterAuditTrailsForSavingsTransaction', () => {
  const audits: FineractAuditTrailListItem[] = [
    { id: 1, resourceId: 10, subresourceId: 99, entityName: 'SAVINGSACCOUNT', actionName: 'DEPOSIT' },
    { id: 2, resourceId: 10, subresourceId: 100, entityName: 'SAVINGSACCOUNT', actionName: 'WITHDRAWAL' },
    { id: 3, resourceId: 99, entityName: 'SAVINGSACCOUNT', actionName: 'DEPOSIT' },
    { id: 4, resourceId: 10, entityName: 'SAVINGSACCOUNT', actionName: 'POSTINTEREST' }
  ];

  it('matches transaction id on subresourceId', () => {
    const result = filterAuditTrailsForSavingsTransaction(audits, 99);
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map((row) => row.id),
      [1, 3]
    );
  });

  it('returns empty for invalid transaction id', () => {
    assert.deepEqual(filterAuditTrailsForSavingsTransaction(audits, 'bad'), []);
  });
});

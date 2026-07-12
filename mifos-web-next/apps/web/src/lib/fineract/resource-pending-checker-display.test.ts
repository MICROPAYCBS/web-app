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
import {
  filterAuditTrailsForResource,
  pendingCheckerActionsFromAudits
} from '@/lib/fineract/resource-pending-checker-filters';
import {
  clientPendingCheckerScope,
  resolvePrimaryPendingCheckerAction,
  SAVINGS_ACCOUNT_CHECKER_ENTITY,
  savingsAccountPendingCheckerScope
} from '@/lib/fineract/resource-pending-checker-display';

describe('filterAuditTrailsForResource', () => {
  it('scopes savings audits to the requested account', () => {
    const audits: FineractAuditTrailListItem[] = [
      { id: 1, resourceId: 10, entityName: SAVINGS_ACCOUNT_CHECKER_ENTITY },
      { id: 2, resourceId: 11, entityName: SAVINGS_ACCOUNT_CHECKER_ENTITY }
    ];

    const filtered = filterAuditTrailsForResource(audits, savingsAccountPendingCheckerScope(10));
    assert.deepEqual(
      filtered.map((item) => item.id),
      [1]
    );
  });
});

describe('pendingCheckerActionsFromAudits', () => {
  it('keeps pending client audits for the requested customer only', () => {
    const actions = pendingCheckerActionsFromAudits(
      [
        {
          id: 1,
          resourceId: 5,
          entityName: 'CLIENT',
          processingResult: 'Awaiting Approval',
          actionName: 'ACTIVATE'
        },
        {
          id: 2,
          resourceId: 6,
          entityName: 'CLIENT',
          processingResult: 'Awaiting Approval',
          actionName: 'ACTIVATE'
        }
      ],
      clientPendingCheckerScope(5)
    );

    assert.deepEqual(
      actions.map((item) => item.id),
      [1]
    );
  });
});

describe('resolvePrimaryPendingCheckerAction', () => {
  it('prefers savings approval before create when awaiting approval', () => {
    const primary = resolvePrimaryPendingCheckerAction(
      [
        { id: 2, actionName: 'CREATE' },
        { id: 1, actionName: 'APPROVE' }
      ],
      SAVINGS_ACCOUNT_CHECKER_ENTITY,
      { code: 'savingsAccountStatusType.submitted.and.pending.approval' }
    );

    assert.equal(primary?.actionName, 'APPROVE');
  });

  it('prefers client activation before create when pending', () => {
    const primary = resolvePrimaryPendingCheckerAction(
      [
        { id: 2, actionName: 'CREATE' },
        { id: 1, actionName: 'ACTIVATE' }
      ],
      'CLIENT',
      { value: 'Pending' }
    );

    assert.equal(primary?.actionName, 'ACTIVATE');
  });
});

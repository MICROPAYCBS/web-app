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
  filterAuditTrailsForLoanAccount,
  loanPendingCheckerActionsFromAudits,
  mergeLoanPendingCheckerActions
} from '@/lib/fineract/loan-account-pending-checker-filters';
import {
  resolvePrimaryLoanPendingCheckerAction,
  type LoanAccountPendingCheckerAction
} from '@/lib/fineract/loan-account-pending-checker-display';

function audit(
  overrides: Partial<FineractAuditTrailListItem> & Pick<FineractAuditTrailListItem, 'id'>
): FineractAuditTrailListItem {
  return {
    processingResult: 'Awaiting Approval',
    entityName: 'LOAN',
    resourceId: 15,
    actionName: 'CREATE',
    ...overrides
  };
}

describe('loanPendingCheckerActionsFromAudits', () => {
  it('keeps pending LOAN audits for the requested account only', () => {
    const actions = loanPendingCheckerActionsFromAudits(
      [
        audit({ id: 1, resourceId: 15, actionName: 'CREATE' }),
        audit({ id: 2, resourceId: 16, actionName: 'CREATE' }),
        audit({ id: 3, resourceId: 15, actionName: 'APPROVE' })
      ],
      15
    );

    assert.deepEqual(
      actions.map((item) => item.id),
      [1, 3]
    );
  });

  it('drops processed audits and non-LOAN entities', () => {
    const actions = loanPendingCheckerActionsFromAudits(
      [
        audit({ id: 1, processingResult: 'Processed' }),
        audit({ id: 2, entityName: 'LOANCHARGE', resourceId: 15 })
      ],
      15
    );

    assert.equal(actions.length, 0);
  });
});

describe('mergeLoanPendingCheckerActions', () => {
  it('deduplicates inbox and audit rows by id', () => {
    const merged = mergeLoanPendingCheckerActions(
      [{ id: 5, actionName: 'APPROVE' }],
      [{ id: 5, actionName: 'APPROVE' }, { id: 4, actionName: 'CREATE' }]
    );

    assert.deepEqual(
      merged.map((item) => item.id),
      [5, 4]
    );
  });
});

describe('resolvePrimaryLoanPendingCheckerAction', () => {
  const pendingStatus = { value: 'Submitted and pending approval' };

  it('prefers APPROVE over CREATE when the loan is awaiting approval', () => {
    const actions: LoanAccountPendingCheckerAction[] = [
      { id: 20, actionName: 'CREATE' },
      { id: 10, actionName: 'APPROVE' }
    ];

    const primary = resolvePrimaryLoanPendingCheckerAction(actions, pendingStatus);
    assert.equal(primary?.id, 10);
    assert.equal(primary?.actionName, 'APPROVE');
  });

  it('falls back to the newest action when no lifecycle match exists', () => {
    const actions: LoanAccountPendingCheckerAction[] = [
      { id: 3, actionName: 'CUSTOM' },
      { id: 2, actionName: 'OTHER' }
    ];

    const primary = resolvePrimaryLoanPendingCheckerAction(actions, pendingStatus);
    assert.equal(primary?.id, 3);
  });
});

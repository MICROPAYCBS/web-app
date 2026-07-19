/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FineractFinancialActivityMappingListItem } from '@mifos/api-client';
import {
  findInterBranchReconGlAccountId,
  INTER_BRANCH_RECON_FINANCIAL_ACTIVITY_NAME,
  DEFAULT_CLEARING_GL_CODE,
  resolveCentralBranchClearingGlAccount
} from '@/lib/accounting/inter-branch-recon';

function mapping(
  activityName: string,
  glAccountId: number,
  glCode = 'MP-20010'
): FineractFinancialActivityMappingListItem {
  return {
    id: 1,
    financialActivityData: {
      id: 203,
      name: activityName,
      mappedGLAccountType: 'LIABILITY'
    },
    glAccountData: {
      id: glAccountId,
      name: 'Inter-Branch Reconciliation',
      glCode
    }
  };
}

describe('findInterBranchReconGlAccountId', () => {
  it('returns GL account id from interBranchRecon financial activity mapping', () => {
    const id = findInterBranchReconGlAccountId([
      mapping('fundSource', 99),
      mapping(INTER_BRANCH_RECON_FINANCIAL_ACTIVITY_NAME, 42)
    ]);
    assert.equal(id, 42);
  });

  it('returns null when interBranchRecon mapping is missing', () => {
    assert.equal(findInterBranchReconGlAccountId([mapping('fundSource', 99)]), null);
  });
});

describe('resolveCentralBranchClearingGlAccount', () => {
  it('prefers interBranchRecon financial activity mapping', () => {
    const result = resolveCentralBranchClearingGlAccount(
      [mapping(INTER_BRANCH_RECON_FINANCIAL_ACTIVITY_NAME, 42)],
      [{ id: 99, glCode: DEFAULT_CLEARING_GL_CODE }]
    );
    assert.equal(result.clearingGlAccountId, 42);
    assert.equal(result.usedFinancialActivityMapping, true);
    assert.equal(result.warning, undefined);
  });

  it('falls back to MP-20010 GL code when mapping is absent', () => {
    const result = resolveCentralBranchClearingGlAccount([], [{ id: 99, glCode: DEFAULT_CLEARING_GL_CODE }]);
    assert.equal(result.clearingGlAccountId, 99);
    assert.equal(result.usedFinancialActivityMapping, false);
    assert.match(result.warning ?? '', /MP-20010/);
  });

  it('blocks posting when neither mapping nor fallback GL exists', () => {
    const result = resolveCentralBranchClearingGlAccount([], []);
    assert.equal(result.clearingGlAccountId, null);
    assert.match(result.warning ?? '', /Financial activity mappings/);
  });
});

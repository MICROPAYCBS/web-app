/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GL_ACCOUNT_TYPE_EXPENSE, GL_ACCOUNT_TYPE_INCOME } from './gl-account-governance';
import { validateUpsertGlAccountForm } from './gl-account.schema';

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    type: GL_ACCOUNT_TYPE_INCOME,
    name: 'Interest income',
    usage: 1,
    glCode: '4001',
    tagId: 10,
    manualEntriesAllowed: true,
    ...overrides
  };
}

describe('validateUpsertGlAccountForm', () => {
  it('requires tagId for income and expense accounts', () => {
    const result = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_INCOME, tagId: undefined })
    );
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'tagId'));
    }

    const expense = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_EXPENSE, glCode: '5100', tagId: undefined })
    );
    assert.equal(expense.success, false);
  });

  it('rejects GL codes that do not match the account class prefix', () => {
    const result = validateUpsertGlAccountForm(baseInput({ glCode: '5100' }));
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'glCode'));
    }
  });

  it('rejects parent accounts from a different class', () => {
    const result = validateUpsertGlAccountForm(baseInput({ parentId: 5 }), {
      parentTypeId: GL_ACCOUNT_TYPE_EXPENSE
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'parentId'));
    }
  });

  it('accepts a valid income account', () => {
    const result = validateUpsertGlAccountForm(baseInput());
    assert.equal(result.success, true);
  });
});

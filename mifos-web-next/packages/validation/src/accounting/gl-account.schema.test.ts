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
  GL_ACCOUNT_TYPE_ASSET,
  GL_ACCOUNT_TYPE_EXPENSE,
  GL_ACCOUNT_TYPE_INCOME,
  deriveGlAccountHeaderStem
} from './gl-account-governance';
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

describe('deriveGlAccountHeaderStem', () => {
  it('strips trailing zeros while keeping the class digit', () => {
    assert.equal(deriveGlAccountHeaderStem('110000'), '110');
    assert.equal(deriveGlAccountHeaderStem('110500'), '1105');
    assert.equal(deriveGlAccountHeaderStem('100000'), '1');
  });
});

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

  it('allows legacy GL codes when structured enforcement is disabled', () => {
    const result = validateUpsertGlAccountForm(baseInput({ glCode: '5100' }), {
      enforceStructured: false,
      parentGlCode: '110000'
    });
    assert.equal(result.success, true);
  });

  it('rejects GL codes that do not match the account class prefix when enforcement is on', () => {
    const result = validateUpsertGlAccountForm(baseInput({ glCode: '510000' }), {
      enforceStructured: true,
      codeLength: 6
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'glCode'));
    }
  });

  it('rejects GL codes with the wrong length when enforcement is on', () => {
    const result = validateUpsertGlAccountForm(baseInput({ glCode: '4001' }), {
      enforceStructured: true,
      codeLength: 6
    });
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

  it('accepts a valid structured income account when enforcement is on', () => {
    const result = validateUpsertGlAccountForm(baseInput({ glCode: '400100' }), {
      enforceStructured: true,
      codeLength: 6
    });
    assert.equal(result.success, true);
  });

  it('accepts a valid income account when enforcement is off', () => {
    const result = validateUpsertGlAccountForm(baseInput());
    assert.equal(result.success, true);
  });

  it('accepts child GL code matching header stem when enforcement is on', () => {
    const result = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_ASSET, glCode: '110001', tagId: undefined }),
      {
        enforceStructured: true,
        codeLength: 6,
        parentGlCode: '110000'
      }
    );
    assert.equal(result.success, true);
  });

  it('rejects child GL code not matching header stem when enforcement is on', () => {
    const result = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_ASSET, glCode: '120001', tagId: undefined }),
      {
        enforceStructured: true,
        codeLength: 6,
        parentGlCode: '110000'
      }
    );
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'glCode'));
    }
  });

  it('grandfathers legacy GL codes on edit until code, class, or parent changes', () => {
    const result = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_INCOME, glCode: '4001', name: 'Updated name' }),
      {
        enforceStructured: true,
        codeLength: 6,
        original: { glCode: '4001', type: GL_ACCOUNT_TYPE_INCOME }
      }
    );
    assert.equal(result.success, true);
  });

  it('applies structured rules on edit when the GL code changes', () => {
    const result = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_INCOME, glCode: '400100' }),
      {
        enforceStructured: true,
        codeLength: 6,
        original: { glCode: '4001', type: GL_ACCOUNT_TYPE_INCOME }
      }
    );
    assert.equal(result.success, true);

    const invalid = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_INCOME, glCode: '4001' }),
      {
        enforceStructured: true,
        codeLength: 6,
        original: { glCode: '4001', type: GL_ACCOUNT_TYPE_INCOME }
      }
    );
    assert.equal(invalid.success, true);

    const changedInvalid = validateUpsertGlAccountForm(
      baseInput({ type: GL_ACCOUNT_TYPE_INCOME, glCode: '510000' }),
      {
        enforceStructured: true,
        codeLength: 6,
        original: { glCode: '4001', type: GL_ACCOUNT_TYPE_INCOME }
      }
    );
    assert.equal(changedInvalid.success, false);
  });
});

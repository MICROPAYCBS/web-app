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
  GL_ACCOUNT_TYPE_INCOME,
  glAccountCodeHeaderStemError,
  glAccountCodeLengthError,
  glAccountCodeTypePrefixError
} from './gl-account-governance';
import { validateUpsertGlAccountForm } from './gl-account.schema';

describe('gl account validation messages', () => {
  it('names the account class and expected digit for prefix errors', () => {
    assert.equal(
      glAccountCodeTypePrefixError(GL_ACCOUNT_TYPE_ASSET, 6),
      'Asset accounts must start with 1 (for example, 100000).'
    );
  });

  it('reports entered digit count for length errors', () => {
    assert.equal(glAccountCodeLengthError('4001', 6), 'GL code must be exactly 6 digits (you entered 4).');
  });

  it('suggests a child code under the parent header', () => {
    assert.match(
      glAccountCodeHeaderStemError('120001', '110000', 6),
      /must start with 110 under parent 110000 \(for example, 110001\)/
    );
  });

  it('uses the asset-specific prefix message for mismatched class codes', () => {
    const result = validateUpsertGlAccountForm(
      {
        type: GL_ACCOUNT_TYPE_ASSET,
        name: 'Assets 2',
        usage: 1,
        glCode: '400000',
        manualEntriesAllowed: true
      },
      { enforceStructured: true, codeLength: 6 }
    );

    assert.equal(result.success, false);
    if (!result.success) {
      const glCodeIssue = result.error.issues.find((issue) => issue.path.join('.') === 'glCode');
      assert.equal(
        glCodeIssue?.message,
        'Asset accounts must start with 1 (for example, 100000).'
      );
    }
  });

  it('uses the income-specific prefix message when the class digit is wrong', () => {
    const result = validateUpsertGlAccountForm(
      {
        type: GL_ACCOUNT_TYPE_INCOME,
        name: 'Interest',
        usage: 1,
        glCode: '510000',
        tagId: 1,
        manualEntriesAllowed: true
      },
      { enforceStructured: true, codeLength: 6 }
    );

    assert.equal(result.success, false);
    if (!result.success) {
      const glCodeIssue = result.error.issues.find((issue) => issue.path.join('.') === 'glCode');
      assert.equal(
        glCodeIssue?.message,
        'Income accounts must start with 4 (for example, 400000).'
      );
    }
  });
});

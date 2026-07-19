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
  GL_ACCOUNT_CODE_NUMBERING_GUIDANCE,
  GL_ACCOUNT_TYPE_ASSET,
  GL_ACCOUNT_TYPE_EXPENSE,
  GL_ACCOUNT_TYPE_INCOME,
  GL_ACCOUNT_TYPE_LIABILITY,
  glAccountCodeHintForType,
  structuredGlCodeEnforcementBanner,
  structuredGlCodeLegacyAccountNotice
} from './gl-account-display';

describe('glAccountCodeHintForType', () => {
  it('returns general guidance when type is unknown', () => {
    assert.equal(glAccountCodeHintForType(undefined), GL_ACCOUNT_CODE_NUMBERING_GUIDANCE);
    assert.equal(glAccountCodeHintForType(99), GL_ACCOUNT_CODE_NUMBERING_GUIDANCE);
  });

  it('returns type-specific prefix hints', () => {
    assert.match(glAccountCodeHintForType(GL_ACCOUNT_TYPE_ASSET), /^Asset accounts typically start with 1/);
    assert.match(
      glAccountCodeHintForType(GL_ACCOUNT_TYPE_LIABILITY),
      /^Liability accounts typically start with 2/
    );
    assert.match(glAccountCodeHintForType(GL_ACCOUNT_TYPE_INCOME), /^Income accounts typically start with 4/);
    assert.match(glAccountCodeHintForType(GL_ACCOUNT_TYPE_EXPENSE), /^Expense accounts typically start with 5/);
  });

  it('returns parent-aware stem hints when structured enforcement is on', () => {
    const hint = glAccountCodeHintForType(GL_ACCOUNT_TYPE_ASSET, {
      enforceStructured: true,
      codeLength: 6,
      parentGlCode: '110000',
      parentName: 'Cash and Banks'
    });
    assert.match(hint, /Under \(110000\) Cash and Banks/);
    assert.match(hint, /starting with 110/);
    assert.match(hint, /110001/);
  });
});

describe('structured GL code banners', () => {
  it('describes enforcement and legacy grandfathering', () => {
    assert.match(structuredGlCodeEnforcementBanner(6), /Asset 1, Liability 2/);
    assert.match(structuredGlCodeLegacyAccountNotice(), /keeps its existing GL code/);
  });
});

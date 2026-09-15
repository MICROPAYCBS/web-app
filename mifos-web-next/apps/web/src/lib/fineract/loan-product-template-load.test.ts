/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { interpretLoanProductTemplateResult } from './loan-product-template-load';

describe('interpretLoanProductTemplateResult', () => {
  it('returns the template when the load succeeded', () => {
    const template = { productOptions: [{ id: 3, name: 'Term loan' }] };
    const result = interpretLoanProductTemplateResult(template);
    assert.deepEqual(result, { ok: true, template });
  });

  it('returns a retryable error without treating the payload as a template', () => {
    const result = interpretLoanProductTemplateResult({
      ok: false,
      message: 'Could not load loan application template.'
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, 'Could not load loan application template.');
    }
  });
});

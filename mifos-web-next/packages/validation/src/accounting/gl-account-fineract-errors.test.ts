/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyGlAccountFineractFieldErrors } from './gl-account-fineract-errors';

describe('applyGlAccountFineractFieldErrors', () => {
  it('maps structured GL code domain errors onto the glCode field', () => {
    const result = applyGlAccountFineractFieldErrors(
      {
        ok: false,
        message: 'Request was understood but caused a domain rule violation.'
      },
      {
        userMessageGlobalisationCode: 'error.msg.glaccount.glcode.invalid.format',
        defaultUserMessage:
          "GL account code '4001' must be exactly 6 numeric digits when structured GL codes are enforced"
      },
      403
    );

    assert.equal(result.message, 'Fix the highlighted fields.');
    assert.equal(
      result.fieldErrors?.glCode,
      "GL account code '4001' must be exactly 6 numeric digits when structured GL codes are enforced"
    );
  });
});

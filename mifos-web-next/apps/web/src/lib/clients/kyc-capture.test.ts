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
  customerClassKycRequirements,
  customerClassNeedsKycStep
} from './kyc-capture';

describe('customerClassKycRequirements', () => {
  it('is off when the class is missing', () => {
    assert.deepEqual(customerClassKycRequirements(undefined), {
      requirePhoto: false,
      requireSignature: false
    });
    assert.equal(customerClassNeedsKycStep(undefined), false);
  });

  it('follows enforce flags', () => {
    assert.deepEqual(
      customerClassKycRequirements({
        id: 1,
        classCode: 'IND',
        className: 'Individual',
        enforceCustPhoto: true,
        enforceCustSignature: false
      }),
      { requirePhoto: true, requireSignature: false }
    );
    assert.equal(
      customerClassNeedsKycStep({
        id: 1,
        classCode: 'IND',
        className: 'Individual',
        enforceCustPhoto: false,
        enforceCustSignature: true
      }),
      true
    );
  });
});

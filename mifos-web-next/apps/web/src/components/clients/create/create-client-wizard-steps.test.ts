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
  CREATE_CLIENT_KYC_STEP,
  CREATE_CLIENT_WIZARD_END_STEPS,
  CREATE_CLIENT_WIZARD_START_STEPS,
  insertCreateClientKycStep
} from './create-client-wizard-steps';

describe('insertCreateClientKycStep', () => {
  const steps = [...CREATE_CLIENT_WIZARD_START_STEPS, ...CREATE_CLIENT_WIZARD_END_STEPS];

  it('omits the KYC step when the class does not require captures', () => {
    const next = insertCreateClientKycStep(steps, false);
    assert.equal(
      next.some((step) => step.id === CREATE_CLIENT_KYC_STEP.id),
      false
    );
  });

  it('inserts the KYC step immediately after Biodata', () => {
    const next = insertCreateClientKycStep(steps, true);
    const biodataIndex = next.findIndex((step) => step.id === 'biodata');
    assert.equal(next[biodataIndex + 1]?.id, CREATE_CLIENT_KYC_STEP.id);
    assert.equal(next[biodataIndex + 1]?.label, 'Photo and signature');
  });
});

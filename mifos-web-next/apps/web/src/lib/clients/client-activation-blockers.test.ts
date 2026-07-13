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
  humanizeActivationBlockerMessage,
  toClientActivationBlocker
} from './client-activation-blockers';
import { customerClassMissingActivationIssue } from '../fineract/customer-class-eligibility';

describe('humanizeActivationBlockerMessage', () => {
  it('turns raw field names into guidance', () => {
    assert.match(humanizeActivationBlockerMessage('customerClassId'), /customer class/i);
  });

  it('passes through readable messages', () => {
    const message = 'Upload a signature before activation.';
    assert.equal(humanizeActivationBlockerMessage(message), message);
  });
});

describe('toClientActivationBlocker', () => {
  it('adds edit guidance for a missing customer class', () => {
    const blocker = toClientActivationBlocker(customerClassMissingActivationIssue());
    assert.match(blocker.message, /customer class/i);
    assert.match(blocker.hint ?? '', /edit/i);
    assert.equal(blocker.action, 'edit-customer');
  });
});

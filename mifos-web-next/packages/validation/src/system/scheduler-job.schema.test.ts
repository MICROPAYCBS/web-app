/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateUpdateSchedulerJob } from './scheduler-job.schema';

const baseJob = {
  displayName: 'Post Interest For Savings',
  cronExpression: '0 0 22 1/1 * ? *',
  active: true
};

describe('validateUpdateSchedulerJob', () => {
  it('accepts an optional description', () => {
    const result = validateUpdateSchedulerJob({
      ...baseJob,
      description: 'Credits earned interest to active savings balances.'
    });
    assert.equal(result.success, true);
  });

  it('accepts an empty description so operators can clear it', () => {
    const result = validateUpdateSchedulerJob({
      ...baseJob,
      description: ''
    });
    assert.equal(result.success, true);
  });

  it('rejects a description longer than 500 characters', () => {
    const result = validateUpdateSchedulerJob({
      ...baseJob,
      description: 'x'.repeat(501)
    });
    assert.equal(result.success, false);
  });
});

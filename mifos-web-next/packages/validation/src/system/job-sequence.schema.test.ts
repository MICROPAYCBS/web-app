/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildJobSequenceApiPayload,
  validateUpsertJobSequence
} from './job-sequence.schema';

const eodPayload = {
  name: 'END_OF_DAY',
  description: 'Default end-of-day close',
  active: true,
  steps: [
    {
      stepOrder: 1,
      stepType: 'OPERATION' as const,
      operationCode: 'ADVANCE_BUSINESS_DATE' as const,
      enabled: true,
      stopOnFailure: true
    },
    {
      stepOrder: 2,
      stepType: 'SCHEDULER_JOB' as const,
      jobShortName: 'LA_ECOB',
      enabled: true,
      stopOnFailure: true
    },
    {
      stepOrder: 3,
      stepType: 'SCHEDULER_JOB' as const,
      jobShortName: 'WC_COB',
      enabled: true,
      stopOnFailure: true
    },
    {
      stepOrder: 4,
      stepType: 'SCHEDULER_JOB' as const,
      jobShortName: 'SA_PINT',
      enabled: true,
      stopOnFailure: true
    },
    {
      stepOrder: 5,
      stepType: 'SCHEDULER_JOB' as const,
      jobShortName: 'GLB_SNAP',
      enabled: true,
      stopOnFailure: true
    }
  ]
};

describe('validateUpsertJobSequence', () => {
  it('accepts a valid END_OF_DAY-shaped payload', () => {
    const result = validateUpsertJobSequence(eodPayload);
    assert.equal(result.success, true);
  });

  it('rejects empty steps', () => {
    const result = validateUpsertJobSequence({ ...eodPayload, steps: [] });
    assert.equal(result.success, false);
  });

  it('rejects scheduler steps without jobShortName', () => {
    const result = validateUpsertJobSequence({
      ...eodPayload,
      steps: [
        {
          stepOrder: 1,
          stepType: 'SCHEDULER_JOB',
          jobShortName: '',
          enabled: true,
          stopOnFailure: true
        }
      ]
    });
    assert.equal(result.success, false);
  });

  it('rejects unknown operation codes', () => {
    const result = validateUpsertJobSequence({
      ...eodPayload,
      steps: [
        {
          stepOrder: 1,
          stepType: 'OPERATION',
          operationCode: 'NOT_A_REAL_OP',
          enabled: true,
          stopOnFailure: true
        }
      ]
    });
    assert.equal(result.success, false);
  });
});

describe('buildJobSequenceApiPayload', () => {
  it('renumbers stepOrder and omits opposite fields', () => {
    const parsed = validateUpsertJobSequence(eodPayload);
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }
    const payload = buildJobSequenceApiPayload(parsed.data);
    assert.deepEqual(
      payload.steps.map((step) => step.stepOrder),
      [1, 2, 3, 4, 5]
    );
    assert.equal(payload.steps[0]?.stepType, 'OPERATION');
    assert.equal(payload.steps[0]?.operationCode, 'ADVANCE_BUSINESS_DATE');
    assert.equal('jobShortName' in (payload.steps[0] ?? {}), false);
    assert.equal(payload.steps[1]?.stepType, 'SCHEDULER_JOB');
    assert.equal(payload.steps[1]?.jobShortName, 'LA_ECOB');
    assert.equal('operationCode' in (payload.steps[1] ?? {}), false);
  });
});

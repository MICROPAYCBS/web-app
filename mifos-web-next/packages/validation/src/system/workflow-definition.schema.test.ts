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
  buildWorkflowDefinitionApiPayload,
  validateUpsertWorkflowDefinition
} from './workflow-definition.schema';

function baseStage(overrides: Record<string, unknown> = {}) {
  return {
    stageCode: 'BRANCH_MANAGER',
    name: 'Branch Manager Review',
    stageType: 'REVIEW',
    requiredApprovals: 1,
    rejectionPolicy: 'ANY',
    escalationEnabled: false,
    actions: ['APPROVE', 'REJECT'],
    ...overrides
  };
}

function baseDefinition(overrides: Record<string, unknown> = {}) {
  return {
    taskPermissionCode: 'CREATE_LOAN',
    name: 'Loan Application Approval',
    priority: 20,
    stages: [baseStage()],
    transitions: [],
    ...overrides
  };
}

describe('validateUpsertWorkflowDefinition', () => {
  it('requires rejection threshold for THRESHOLD policy', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        stages: [baseStage({ rejectionPolicy: 'THRESHOLD', rejectionThreshold: null })]
      })
    );
    assert.equal(result.success, false);
  });

  it('forbids rejection threshold when policy is not THRESHOLD', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        stages: [baseStage({ rejectionPolicy: 'ANY', rejectionThreshold: 2 })]
      })
    );
    assert.equal(result.success, false);
  });

  it('requires expiry and escalation target when escalation is enabled', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        stages: [
          baseStage({ escalationEnabled: true, escalationTargetStageCode: 'REGIONAL_MANAGER' })
        ]
      })
    );
    assert.equal(result.success, false);
  });

  it('requires transition stage codes to exist in stages', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        transitions: [
          {
            fromStageCode: 'BRANCH_MANAGER',
            toStageCode: 'UNKNOWN',
            sequenceNo: 1
          }
        ]
      })
    );
    assert.equal(result.success, false);
  });

  it('includes optional stage roleId in the API payload', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        stages: [baseStage({ roleId: 5 }), baseStage({ stageCode: 'REGIONAL_MANAGER', roleId: null })]
      })
    );
    assert.equal(result.success, true);
    if (result.success) {
      const payload = buildWorkflowDefinitionApiPayload(result.data);
      assert.equal(payload.stages[0].roleId, 5);
      assert.equal(payload.stages[1].roleId, undefined);
    }
  });

  it('accepts a valid definition payload without amount criteria', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        stages: [
          baseStage({
            escalationEnabled: true,
            expiryPeriodUnit: 'HOURS',
            expiryPeriodValue: 24,
            escalationTargetStageCode: 'REGIONAL_MANAGER'
          }),
          baseStage({ stageCode: 'REGIONAL_MANAGER', name: 'Regional Manager' })
        ],
        transitions: [
          {
            fromStageCode: 'BRANCH_MANAGER',
            toStageCode: 'REGIONAL_MANAGER',
            sequenceNo: 1
          }
        ]
      })
    );
    assert.equal(result.success, true);
    if (result.success) {
      const payload = buildWorkflowDefinitionApiPayload(result.data);
      assert.equal(payload.taskPermissionCode, 'CREATE_LOAN');
      assert.equal('currencyCode' in payload, false);
      assert.equal('minAmount' in payload, false);
      assert.equal('maxAmount' in payload, false);
      assert.equal('approvalLimitAmount' in payload.stages[0], false);
      assert.equal('participants' in payload.stages[0], false);
      assert.equal('minAmount' in payload.transitions[0], false);
    }
  });
});

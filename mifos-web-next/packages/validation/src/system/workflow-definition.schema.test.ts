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
    name: 'Large Loan Approval',
    priority: 20,
    currencyCode: 'UGX',
    minAmount: 5_000_000,
    stages: [baseStage()],
    transitions: [],
    ...overrides
  };
}

describe('validateUpsertWorkflowDefinition', () => {
  it('requires currency when amount criteria are set', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({ currencyCode: null, minAmount: 1000 })
    );
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((issue) => issue.path.join('.') === 'currencyCode'));
    }
  });

  it('rejects min amount greater than max amount', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({ minAmount: 10, maxAmount: 5, currencyCode: 'UGX' })
    );
    assert.equal(result.success, false);
  });

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

  it('requires approval limit currency when a stage limit amount is set', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        stages: [baseStage({ approvalLimitAmount: 50_000_000, approvalLimitCurrency: null })]
      })
    );
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.issues.some((issue) =>
          issue.path.join('.').endsWith('approvalLimitCurrency')
        )
      );
    }
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

  it('accepts a valid definition payload without participants', () => {
    const result = validateUpsertWorkflowDefinition(
      baseDefinition({
        stages: [
          baseStage({
            escalationEnabled: true,
            expiryPeriodUnit: 'HOURS',
            expiryPeriodValue: 24,
            escalationTargetStageCode: 'REGIONAL_MANAGER',
            approvalLimitAmount: 50_000_000,
            approvalLimitCurrency: 'UGX'
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
      assert.equal(payload.stages[0].approvalLimitAmount, 50_000_000);
      assert.equal(payload.stages[0].approvalLimitCurrency, 'UGX');
      assert.equal('participants' in payload.stages[0], false);
    }
  });
});

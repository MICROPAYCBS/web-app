/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { WorkflowDefinition } from '@mifos/api-client';
import {
  buildWorkflowStageProgress,
  isAwaitingSystemCheckerApproval,
  isFinalWorkflowStage,
  workflowCheckerStepCount,
  workflowStagePositionLabel
} from './workflow-stage-progress';

const definition: WorkflowDefinition = {
  id: 1,
  name: 'Test',
  taskPermissionCode: 'ACTIVATE_SAVINGSACCOUNT',
  status: 'ACTIVE',
  stages: [
    {
      stageCode: 'REVIEW',
      name: 'Review',
      stageType: 'REVIEW',
      requiredApprovals: 1,
      actions: ['APPROVE', 'REJECT']
    },
    {
      stageCode: 'BRANCH',
      name: 'Branch approval',
      stageType: 'APPROVAL',
      requiredApprovals: 1,
      actions: ['APPROVE', 'REJECT']
    },
    {
      stageCode: 'HEAD',
      name: 'Head office',
      stageType: 'APPROVAL',
      requiredApprovals: 1,
      actions: ['APPROVE', 'REJECT']
    }
  ],
  transitions: [
    { fromStageCode: 'REVIEW', toStageCode: 'BRANCH', sequenceNo: 1 },
    { fromStageCode: 'BRANCH', toStageCode: 'HEAD', sequenceNo: 1 }
  ]
};

describe('workflowCheckerStepCount', () => {
  it('includes the system checker step after configured stages', () => {
    assert.equal(workflowCheckerStepCount(definition), 4);
  });
});

describe('workflowStagePositionLabel', () => {
  it('counts configured stages separately from the system checker', () => {
    assert.equal(
      workflowStagePositionLabel(definition, {
        status: 'IN_PROGRESS',
        currentStageCode: 'REVIEW'
      }),
      'Stage 1 of 4'
    );
    assert.equal(
      workflowStagePositionLabel(definition, {
        status: 'IN_PROGRESS',
        currentStageCode: 'HEAD'
      }),
      'Stage 3 of 4'
    );
    assert.equal(
      workflowStagePositionLabel(definition, { status: 'COMPLETED', currentStageCode: 'HEAD' }),
      'Stage 4 of 4'
    );
  });
});

describe('isFinalWorkflowStage', () => {
  it('is only final on the system checker step', () => {
    assert.equal(
      isFinalWorkflowStage(definition, {
        status: 'IN_PROGRESS',
        currentStageCode: 'HEAD'
      }),
      false
    );
    assert.equal(
      isFinalWorkflowStage(definition, { status: 'COMPLETED', currentStageCode: 'HEAD' }),
      true
    );
  });
});

describe('buildWorkflowStageProgress', () => {
  it('keeps the checker bookend upcoming until workflow stages complete', () => {
    const progress = buildWorkflowStageProgress(definition, {
      status: 'IN_PROGRESS',
      currentStageCode: 'HEAD'
    });
    const checker = progress.find((item) => item.key === 'bookend-end');
    const head = progress.find((item) => item.key === 'HEAD');

    assert.equal(head?.state, 'current');
    assert.equal(checker?.state, 'upcoming');
  });

  it('marks checker as current after workflow completion', () => {
    assert.equal(isAwaitingSystemCheckerApproval({ status: 'COMPLETED', currentStageCode: 'HEAD' }), true);
    const progress = buildWorkflowStageProgress(definition, {
      status: 'COMPLETED',
      currentStageCode: 'HEAD'
    });
    const checker = progress.find((item) => item.key === 'bookend-end');

    assert.equal(checker?.state, 'current');
  });
});

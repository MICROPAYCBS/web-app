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
  findActiveWorkflowPeer,
  getWorkflowActivateBlockReason,
  isWorkflowActivePeerExistsError,
  workflowActivateBlockHint
} from '@/lib/fineract/approval-workflow-display';

const definitions = [
  {
    id: 1,
    name: 'Loan draft',
    status: 'DRAFT' as const,
    taskPermissionCode: 'CREATE_LOAN'
  },
  {
    id: 2,
    name: 'Loan active',
    status: 'ACTIVE' as const,
    taskPermissionCode: 'CREATE_LOAN'
  },
  {
    id: 3,
    name: 'Write-off active',
    status: 'ACTIVE' as const,
    taskPermissionCode: 'WRITEOFF_LOAN'
  }
];

describe('findActiveWorkflowPeer', () => {
  it('finds another ACTIVE definition for the same task', () => {
    const peer = findActiveWorkflowPeer(definitions, 'CREATE_LOAN', 1);
    assert.equal(peer?.id, 2);
    assert.equal(peer?.name, 'Loan active');
  });

  it('ignores ACTIVE definitions for other tasks', () => {
    assert.equal(findActiveWorkflowPeer(definitions, 'APPROVE_LOAN', 1), undefined);
  });

  it('excludes the definition being activated', () => {
    assert.equal(findActiveWorkflowPeer(definitions, 'CREATE_LOAN', 2), undefined);
  });
});

describe('getWorkflowActivateBlockReason', () => {
  it('prefers global maker-checker over task and peer gates', () => {
    assert.equal(
      getWorkflowActivateBlockReason({
        makerCheckerGloballyEnabled: false,
        taskPermissionCode: 'CREATE_LOAN',
        taskPermissions: [{ grouping: 'portfolio', code: 'CREATE_LOAN', selected: false }],
        definitions,
        definitionId: 1
      }),
      'global'
    );
  });

  it('prefers per-task maker-checker over active peer', () => {
    assert.equal(
      getWorkflowActivateBlockReason({
        makerCheckerGloballyEnabled: true,
        taskPermissionCode: 'CREATE_LOAN',
        taskPermissions: [{ grouping: 'portfolio', code: 'CREATE_LOAN', selected: false }],
        definitions,
        definitionId: 1
      }),
      'task'
    );
  });

  it('blocks when another ACTIVE workflow exists for the task', () => {
    assert.equal(
      getWorkflowActivateBlockReason({
        makerCheckerGloballyEnabled: true,
        taskPermissionCode: 'CREATE_LOAN',
        taskPermissions: [{ grouping: 'portfolio', code: 'CREATE_LOAN', selected: true }],
        definitions,
        definitionId: 1
      }),
      'activePeer'
    );
  });

  it('allows activate when no peer and maker-checker is on', () => {
    assert.equal(
      getWorkflowActivateBlockReason({
        makerCheckerGloballyEnabled: true,
        taskPermissionCode: 'CREATE_LOAN',
        taskPermissions: [{ grouping: 'portfolio', code: 'CREATE_LOAN', selected: true }],
        definitions: [definitions[0]!],
        definitionId: 1
      }),
      null
    );
  });
});

describe('workflowActivateBlockHint', () => {
  it('names the active peer when provided', () => {
    assert.match(
      workflowActivateBlockHint('activePeer', 'Loan active') ?? '',
      /Loan active/
    );
  });
});

describe('isWorkflowActivePeerExistsError', () => {
  it('detects the backend globalisation code', () => {
    assert.equal(
      isWorkflowActivePeerExistsError(
        'error.msg.workflow.configuration.active.definition.already.exists.for.task'
      ),
      true
    );
  });
});

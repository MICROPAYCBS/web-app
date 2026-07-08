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
  actionSuccessFromFineractCommand,
  classifyMakerCheckerApproveOutcome,
  classifyMakerCheckerRejectOutcome,
  commandOutcomeMessage,
  isPendingCheckerApproval,
  isWorkflowStageApprovalResult,
  parseFineractCommandResult,
  readFineractCommandResourceId
} from './fineract-command-result';

describe('parseFineractCommandResult', () => {
  it('normalizes committed loan create payloads', () => {
    const parsed = parseFineractCommandResult({
      commandId: 99,
      clientId: 12,
      loanId: 501,
      resourceId: 501
    });

    assert.equal(parsed.commandId, 99);
    assert.equal(parsed.clientId, 12);
    assert.equal(parsed.loanId, 501);
    assert.equal(parsed.resourceId, 501);
    assert.equal(parsed.rollbackTransaction, undefined);
  });

  it('normalizes pending checker payloads', () => {
    const parsed = parseFineractCommandResult({
      command_id: 77,
      rollbackTransaction: true
    });

    assert.equal(parsed.commandId, 77);
    assert.equal(parsed.rollbackTransaction, true);
  });
});

describe('isPendingCheckerApproval', () => {
  it('detects rollbackTransaction', () => {
    assert.equal(isPendingCheckerApproval({ rollbackTransaction: true }), true);
    assert.equal(isPendingCheckerApproval({ rollback_transaction: true }), true);
    assert.equal(isPendingCheckerApproval({ loanId: 1 }), false);
  });
});

describe('readFineractCommandResourceId', () => {
  it('returns undefined when pending checker', () => {
    assert.equal(
      readFineractCommandResourceId({ resourceId: 10, rollbackTransaction: true }),
      undefined
    );
  });

  it('prefers resourceId then entity-specific ids', () => {
    assert.equal(readFineractCommandResourceId({ resourceId: 10 }), 10);
    assert.equal(readFineractCommandResourceId({ loanId: 22 }), 22);
  });
});

describe('actionSuccessFromFineractCommand', () => {
  it('strips entity ids when pending checker', () => {
    const result = actionSuccessFromFineractCommand(
      { commandId: 5, rollbackTransaction: true, loanId: 999 },
      { resourceId: 999 }
    );

    assert.deepEqual(result, { ok: true, pendingChecker: true, commandId: 5 });
  });

  it('returns fields when committed', () => {
    const result = actionSuccessFromFineractCommand(
      { loanId: 42, resourceId: 42 },
      { resourceId: 42 }
    );

    assert.deepEqual(result, { ok: true, resourceId: 42 });
  });
});

describe('commandOutcomeMessage', () => {
  it('uses pending copy when checker approval is required', () => {
    assert.equal(
      commandOutcomeMessage('Loan application submitted.', { pendingChecker: true }),
      'Submitted for approval.'
    );
    assert.equal(
      commandOutcomeMessage('Loan application submitted.', {
        pendingChecker: true,
        pendingMessage: 'Loan application sent for approval.'
      }),
      'Loan application sent for approval.'
    );
    assert.equal(commandOutcomeMessage('Loan application submitted.'), 'Loan application submitted.');
  });
});

describe('isWorkflowStageApprovalResult', () => {
  it('detects commandId-only intermediate workflow approve', () => {
    assert.equal(
      isWorkflowStageApprovalResult({ commandId: 1284 }, { actionName: 'APPROVE', entityName: 'LOAN' }),
      true
    );
  });

  it('detects terminal loan approve with loanId', () => {
    assert.equal(
      isWorkflowStageApprovalResult(
        { commandId: 1284, loanId: 15, resourceId: 15 },
        { actionName: 'APPROVE', entityName: 'LOAN' }
      ),
      false
    );
  });

  it('ignores maker pending rollback payloads', () => {
    assert.equal(
      isWorkflowStageApprovalResult(
        { commandId: 1284, rollbackTransaction: true },
        { actionName: 'APPROVE', entityName: 'LOAN' }
      ),
      false
    );
  });
});

describe('classifyMakerCheckerApproveOutcome', () => {
  it('returns workflow_stage_recorded for intermediate stage', () => {
    assert.equal(
      classifyMakerCheckerApproveOutcome({ commandId: 99 }, { entityName: 'LOAN', actionName: 'APPROVE' }),
      'workflow_stage_recorded'
    );
  });
});

describe('classifyMakerCheckerRejectOutcome', () => {
  it('returns workflow_stage_rejection when item remains pending', () => {
    assert.equal(classifyMakerCheckerRejectOutcome(true), 'workflow_stage_rejection');
    assert.equal(classifyMakerCheckerRejectOutcome(false), 'completed');
  });
});

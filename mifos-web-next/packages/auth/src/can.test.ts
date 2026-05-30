import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { can, canAll } from './can';
import type { SessionUser } from './types';

const baseUser = (permissions: string[]): SessionUser => ({
  userId: 1,
  username: 'test',
  officeId: 1,
  permissions
});

describe('can', () => {
  it('grants ALL_FUNCTIONS', () => {
    assert.equal(can(baseUser(['ALL_FUNCTIONS']), 'CREATE_CLIENT'), true);
  });

  it('grants READ_* via ALL_FUNCTIONS_READ', () => {
    assert.equal(can(baseUser(['ALL_FUNCTIONS_READ']), 'READ_CLIENT'), true);
    assert.equal(can(baseUser(['ALL_FUNCTIONS_READ']), 'CREATE_CLIENT'), false);
  });

  it('matches exact permission', () => {
    assert.equal(can(baseUser(['READ_CLIENT']), 'READ_CLIENT'), true);
    assert.equal(can(baseUser(['READ_CLIENT']), 'CREATE_CLIENT'), false);
  });

  it('treats array as OR', () => {
    assert.equal(can(baseUser(['READ_LOAN']), ['READ_CLIENT', 'READ_LOAN']), true);
  });

  it('supports PermissionRule any/all', () => {
    assert.equal(can(baseUser(['A', 'B']), { all: ['A', 'B'] }), true);
    assert.equal(can(baseUser(['A']), { all: ['A', 'B'] }), false);
    assert.equal(can(baseUser(['A']), { any: ['A', 'B'] }), true);
  });

  it('denies empty permission string', () => {
    assert.equal(can(baseUser(['READ_CLIENT']), ''), false);
  });
});

describe('canAll', () => {
  it('requires every permission', () => {
    assert.equal(canAll(baseUser(['READ_CLIENT', 'CREATE_CLIENT']), ['READ_CLIENT', 'CREATE_CLIENT']), true);
    assert.equal(canAll(baseUser(['READ_CLIENT']), ['READ_CLIENT', 'CREATE_CLIENT']), false);
  });
});

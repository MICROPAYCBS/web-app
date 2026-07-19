import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRoutePermission } from './route-manifest';
import { can } from './can';
import type { SessionUser } from './types';

const baseUser = (permissions: string[]): SessionUser => ({
  userId: 1,
  username: 'test',
  officeId: 1,
  permissions
});

describe('getRoutePermission', () => {
  it('uses organization.cashiers.view for cashier detail URLs', () => {
    const required = getRoutePermission('/organization/tellers/1/cashiers/3');
    assert.equal(can(baseUser(['READ_MY_CASHIER']), required!), true);
    assert.equal(can(baseUser(['READ_TELLER']), required!), true);
    assert.equal(can(baseUser(['READ_CLIENT']), required!), false);
  });
});

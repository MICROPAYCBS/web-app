import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeSavingsListItem } from './savings-accounts-list-item';

describe('normalizeSavingsListItem', () => {
  it('reads product, balance, and branch from the account list payload', () => {
    const item = normalizeSavingsListItem({
      id: 12,
      accountNo: '000000012',
      clientId: 4,
      clientName: 'Ada',
      savingsProductName: 'Daily Savings',
      officeName: 'Kampala',
      currency: { code: 'UGX' },
      summary: { accountBalance: 1500 },
      status: { id: 300, code: 'savingsAccountStatusType.active', value: 'Active' },
      depositType: { id: 100, code: 'depositAccountType.savingsDeposit', value: 'Savings' }
    });

    assert.equal(item?.productName, 'Daily Savings');
    assert.equal(item?.accountBalance, 1500);
    assert.equal(item?.officeName, 'Kampala');
  });

  it('keeps a zero balance', () => {
    const item = normalizeSavingsListItem({
      id: 1,
      accountNo: '000000001',
      savingsProductName: 'Wallet',
      summary: { accountBalance: 0 },
      depositType: { id: 100, value: 'Savings' }
    });
    assert.equal(item?.accountBalance, 0);
  });
});

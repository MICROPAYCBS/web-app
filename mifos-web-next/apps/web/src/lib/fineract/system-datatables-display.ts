/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const APPLICATION_TABLE_LABELS: Record<string, string> = {
  m_client: 'Customer',
  m_group: 'Group',
  m_center: 'Center',
  m_office: 'Office',
  m_loan: 'Loan account',
  m_savings_account: 'Savings account',
  m_product_loan: 'Loan product',
  m_savings_account_transaction: 'Savings account transaction',
  m_savings_product: 'Deposit product',
  m_share_product: 'Share product'
};

export function formatApplicationTableLabel(applicationTableName?: string): string {
  if (!applicationTableName) {
    return '—';
  }
  return APPLICATION_TABLE_LABELS[applicationTableName] ?? applicationTableName;
}

export function formatEntitySubType(entitySubType?: string): string {
  return entitySubType?.trim() || '—';
}

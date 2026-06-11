/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { AccountingRuleDetailView } from '@/components/accounting/accounting-rules/accounting-rule-detail-view';
import { getAccountingRule } from '@/lib/fineract/accounting-rules';
import { getServerSession } from '@/lib/session/server';

export default async function AccountingRuleDetailPage({
  params
}: {
  params: Promise<{ accountingRuleId: string }>;
}) {
  const { accountingRuleId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.rules'))) {
    notFound();
  }

  const id = Number(accountingRuleId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const rule = await getAccountingRule(id);
  if (!rule) {
    notFound();
  }

  return (
    <AccountingRuleDetailView
      rule={rule}
      canUpdate={can(session, 'UPDATE_ACCOUNTINGRULE')}
      canDelete={can(session, 'DELETE_ACCOUNTINGRULE')}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { AccountingRuleForm } from '@/components/accounting/accounting-rules/accounting-rule-form';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { accountingRuleToFormValues } from '@/lib/accounting/accounting-rule-display';
import { getAccountingRule, getAccountingRuleFormTemplate } from '@/lib/fineract/accounting-rules';
import { getServerSession } from '@/lib/session/server';

export default async function EditAccountingRulePage({
  params
}: {
  params: Promise<{ accountingRuleId: string }>;
}) {
  const { accountingRuleId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.rules')) || !can(session, 'UPDATE_ACCOUNTINGRULE')) {
    notFound();
  }

  const id = Number(accountingRuleId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const [rule, template] = await Promise.all([getAccountingRule(id), getAccountingRuleFormTemplate()]);
  if (!rule) {
    notFound();
  }

  return (
    <ListPage
      backLink={
        <DetailBackLink
          href={`/accounting/accounting-rules/${id}`}
          label="Back to accounting rule"
        />
      }
      title="Edit accounting rule"
      description={rule.name}
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <AccountingRuleForm
          mode="edit"
          accountingRuleId={id}
          initialValues={accountingRuleToFormValues(rule)}
          template={template}
        />
      </div>
    </ListPage>
  );
}

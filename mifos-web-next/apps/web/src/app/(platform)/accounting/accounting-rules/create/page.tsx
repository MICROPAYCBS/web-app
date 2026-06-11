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
import { defaultAccountingRuleFormValues } from '@/lib/accounting/accounting-rule-display';
import { getAccountingRuleFormTemplate } from '@/lib/fineract/accounting-rules';
import { getServerSession } from '@/lib/session/server';

export default async function CreateAccountingRulePage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.rules')) || !can(session, 'CREATE_ACCOUNTINGRULE')) {
    notFound();
  }

  const template = await getAccountingRuleFormTemplate();

  return (
    <ListPage
      backLink={<DetailBackLink href="/accounting/accounting-rules" label="Back to accounting rules" />}
      title="Create accounting rule"
      description="Define how debit and credit GL entries are resolved for manual journal postings."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <AccountingRuleForm
          mode="create"
          initialValues={defaultAccountingRuleFormValues(template)}
          template={template}
        />
      </div>
    </ListPage>
  );
}

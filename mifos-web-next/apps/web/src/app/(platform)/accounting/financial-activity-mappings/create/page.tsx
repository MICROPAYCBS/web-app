/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FinancialActivityMappingForm } from '@/components/accounting/financial-activity-mappings/financial-activity-mapping-form';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { defaultFinancialActivityMappingFormValues } from '@/lib/accounting/financial-activity-mapping-display';
import { getFinancialActivityMappingFormTemplate } from '@/lib/fineract/financial-activity-mappings';
import { getServerSession } from '@/lib/session/server';

export default async function CreateFinancialActivityMappingPage() {
  const session = await getServerSession();
  if (
    !can(session, resolvePermission('accounting.financialActivity')) ||
    !can(session, 'CREATE_FINANCIALACTIVITYACCOUNT')
  ) {
    notFound();
  }

  const template = await getFinancialActivityMappingFormTemplate();

  return (
    <ListPage
      backLink={
        <DetailBackLink
          href="/accounting/financial-activity-mappings"
          label="Back to financial activity mappings"
        />
      }
      title="Define mapping"
      description="Link a financial activity to a GL account for automated accounting transfers."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <FinancialActivityMappingForm
          mode="create"
          initialValues={defaultFinancialActivityMappingFormValues()}
          template={template}
        />
      </div>
    </ListPage>
  );
}

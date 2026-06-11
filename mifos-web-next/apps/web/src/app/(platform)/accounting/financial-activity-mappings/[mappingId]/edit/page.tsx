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
import {
  financialActivityMappingFormTemplateFromEditData,
  financialActivityMappingFormValuesFromEditData
} from '@/lib/accounting/financial-activity-mapping-display';
import { getFinancialActivityMappingForEdit } from '@/lib/fineract/financial-activity-mappings';
import { getServerSession } from '@/lib/session/server';

export default async function EditFinancialActivityMappingPage({
  params
}: {
  params: Promise<{ mappingId: string }>;
}) {
  const session = await getServerSession();
  if (
    !can(session, resolvePermission('accounting.financialActivity')) ||
    !can(session, 'UPDATE_FINANCIALACTIVITYACCOUNT')
  ) {
    notFound();
  }

  const { mappingId } = await params;
  const editData = await getFinancialActivityMappingForEdit(Number(mappingId));
  if (!editData) {
    notFound();
  }

  return (
    <ListPage
      backLink={
        <DetailBackLink
          href={`/accounting/financial-activity-mappings/${mappingId}`}
          label="Back to mapping"
        />
      }
      title="Edit mapping"
      description="Update the GL account linked to this financial activity."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <FinancialActivityMappingForm
          mode="edit"
          mappingId={Number(mappingId)}
          initialValues={financialActivityMappingFormValuesFromEditData(editData)}
          template={financialActivityMappingFormTemplateFromEditData(editData)}
        />
      </div>
    </ListPage>
  );
}

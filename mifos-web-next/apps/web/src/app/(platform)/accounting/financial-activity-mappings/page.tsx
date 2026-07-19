/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FinancialActivityMappingsPageContent } from '@/components/accounting/financial-activity-mappings/financial-activity-mappings-page-content';
import {
  getFinancialActivityMappingFormTemplate,
  listFinancialActivityMappings
} from '@/lib/fineract/financial-activity-mappings';
import { getServerSession } from '@/lib/session/server';

export default async function FinancialActivityMappingsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.financialActivity'))) {
    notFound();
  }

  const [mappings, template] = await Promise.all([
    listFinancialActivityMappings(),
    getFinancialActivityMappingFormTemplate()
  ]);

  return (
    <FinancialActivityMappingsPageContent
      mappings={mappings}
      template={template}
      canCreate={can(session, 'CREATE_FINANCIALACTIVITYACCOUNT')}
      canUpdate={can(session, 'UPDATE_FINANCIALACTIVITYACCOUNT')}
    />
  );
}

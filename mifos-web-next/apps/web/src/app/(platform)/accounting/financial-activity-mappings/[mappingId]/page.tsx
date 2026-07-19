/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FinancialActivityMappingDetailView } from '@/components/accounting/financial-activity-mappings/financial-activity-mapping-detail-view';
import { getFinancialActivityMapping } from '@/lib/fineract/financial-activity-mappings';
import { getServerSession } from '@/lib/session/server';

export default async function FinancialActivityMappingDetailPage({
  params
}: {
  params: Promise<{ mappingId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.financialActivity'))) {
    notFound();
  }

  const { mappingId } = await params;
  const mapping = await getFinancialActivityMapping(Number(mappingId));
  if (!mapping) {
    notFound();
  }

  return (
    <FinancialActivityMappingDetailView
      mapping={mapping}
      canUpdate={can(session, 'UPDATE_FINANCIALACTIVITYACCOUNT')}
      canDelete={can(session, 'DELETE_FINANCIALACTIVITYACCOUNT')}
    />
  );
}

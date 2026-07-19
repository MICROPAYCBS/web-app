/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FundsPageContent } from '@/components/organization/funds-page-content';
import { listOrganizationFunds } from '@/lib/fineract/funds';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationManageFundsPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.funds'))) {
    notFound();
  }

  const funds = await listOrganizationFunds();

  return (
    <FundsPageContent
      funds={funds}
      canCreate={can(session, 'CREATE_FUND')}
      canEdit={can(session, 'UPDATE_FUND')}
    />
  );
}

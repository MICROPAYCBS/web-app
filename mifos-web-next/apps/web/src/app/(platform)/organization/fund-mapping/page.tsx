/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { FundMappingPageContent } from '@/components/organization/fund-mapping-page-content';
import { getFundMappingAdvanceSearchTemplate } from '@/lib/fineract/fund-mapping';
import { getServerSession } from '@/lib/session/server';

export default async function FundMappingPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.fundMapping'))) {
    notFound();
  }

  const template = await getFundMappingAdvanceSearchTemplate();

  return <FundMappingPageContent template={template} />;
}

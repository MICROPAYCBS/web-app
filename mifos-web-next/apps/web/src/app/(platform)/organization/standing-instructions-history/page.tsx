/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { StandingInstructionHistoryPageContent } from '@/components/organization/standing-instruction-history-page-content';
import { getOrganizationStandingInstructionTemplate } from '@/lib/fineract/standing-instruction-run-history';
import { getServerSession } from '@/lib/session/server';

export default async function StandingInstructionsHistoryPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('organization.standingInstructions'))) {
    notFound();
  }

  const template = await getOrganizationStandingInstructionTemplate();

  return <StandingInstructionHistoryPageContent template={template} />;
}

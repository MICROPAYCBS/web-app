/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SystemInformationPageContent } from '@/components/system/system-information-page-content';
import { getSystemInformation } from '@/lib/fineract/system-information';
import { getServerSession } from '@/lib/session/server';

export default async function SystemInformationPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.information'))) {
    notFound();
  }

  const info = await getSystemInformation();
  return <SystemInformationPageContent info={info} />;
}

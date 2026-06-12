/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CreateCenterPageContent } from '@/components/centers/create-center-page-content';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function CreateCenterPage() {
  const session = await getServerSession();
  if (!can(session, 'CREATE_CENTER')) {
    notFound();
  }

  const offices = await listOfficeOptions();
  return <CreateCenterPageContent offices={offices} />;
}

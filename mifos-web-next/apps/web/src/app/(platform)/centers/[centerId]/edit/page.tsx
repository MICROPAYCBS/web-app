/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { EditCenterPageContent } from '@/components/centers/edit-center-page-content';
import { getCenterEditTemplate } from '@/lib/fineract/centers';
import { getServerSession } from '@/lib/session/server';

export default async function EditCenterPage({
  params
}: {
  params: Promise<{ centerId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, 'UPDATE_CENTER')) {
    notFound();
  }

  const { centerId } = await params;
  const center = await getCenterEditTemplate(centerId);
  if (!center) {
    notFound();
  }

  return <EditCenterPageContent center={center} />;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { CenterDetailShell } from '@/components/centers/center-detail-shell';
import { getCenter } from '@/lib/fineract/centers';
import { getServerSession } from '@/lib/session/server';

export default async function CenterDetailLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ centerId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('clients.list'))) {
    notFound();
  }

  const { centerId } = await params;
  const center = await getCenter(centerId);
  if (!center) {
    notFound();
  }

  const canEdit = can(session, 'UPDATE_CENTER');

  return (
    <CenterDetailShell center={center} canEdit={canEdit}>
      {children}
    </CenterDetailShell>
  );
}

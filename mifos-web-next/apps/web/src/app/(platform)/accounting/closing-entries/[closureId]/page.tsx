/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { GlClosureDetailView } from '@/components/accounting/gl-closure-detail-view';
import { getGlClosure } from '@/lib/fineract/gl-closures';
import { listOfficeOptions } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

export default async function GlClosureDetailPage({
  params
}: {
  params: Promise<{ closureId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('accounting.closing'))) {
    notFound();
  }

  const { closureId: closureIdParam } = await params;
  const closureId = Number(closureIdParam);
  if (!Number.isFinite(closureId)) {
    notFound();
  }

  const [closure, offices] = await Promise.all([
    getGlClosure(closureId),
    listOfficeOptions()
  ]);

  if (!closure) {
    notFound();
  }

  return (
    <GlClosureDetailView
      closure={closure}
      offices={offices}
      canUpdate={can(session, 'UPDATE_GLCLOSURE')}
      canDelete={can(session, 'DELETE_GLCLOSURE')}
    />
  );
}

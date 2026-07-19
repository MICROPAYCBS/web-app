/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { AuditTrailDetailView } from '@/components/system/audit-trail-detail-view';
import { getAuditTrail } from '@/lib/fineract/audit-trails';
import { getServerSession } from '@/lib/session/server';

export default async function AuditTrailDetailPage({
  params
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.audit'))) {
    notFound();
  }

  const id = Number(auditId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const audit = await getAuditTrail(id);
  if (!audit) {
    notFound();
  }

  return <AuditTrailDetailView audit={audit} />;
}

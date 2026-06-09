/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AuditTrailsPageContent } from '@/components/system/audit-trails-page-content';
import { parseAuditTrailListQuery } from '@/lib/fineract/audit-trail-query';
import { getAuditTrailSearchTemplate, listAuditTrails } from '@/lib/fineract/audit-trails';
import { getServerSession } from '@/lib/session/server';

export default async function AuditTrailsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.audit'))) {
    notFound();
  }

  const params = await searchParams;
  const template = await getAuditTrailSearchTemplate();
  const query = parseAuditTrailListQuery(params, {
    dateFormat: template.dateFormat,
    locale: template.locale
  });
  const page = await listAuditTrails(query);

  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading audit trails…</p>}>
      <AuditTrailsPageContent page={page} query={query} template={template} />
    </Suspense>
  );
}

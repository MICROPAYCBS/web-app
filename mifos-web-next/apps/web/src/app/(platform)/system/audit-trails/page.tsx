/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { AuditTrailsPageContent } from '@/components/system/audit-trails-page-content';
import { parseAuditTrailListQuery } from '@/lib/fineract/audit-trail-query';
import { getAuditTrailSearchTemplate, listAuditTrails } from '@/lib/fineract/audit-trails';
import { getGlobalConfigurationByName } from '@/lib/fineract/global-configurations';
import {
  ENABLE_ORGANIZATION_WIDE_AUDIT_VIEW_CONFIG_NAME,
  VIEW_ORGANIZATION_AUDIT_PERMISSION
} from '@/lib/fineract/organization-wide-audit-policy-paths';
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
  const orgWideAuditConfig = await getGlobalConfigurationByName(
    ENABLE_ORGANIZATION_WIDE_AUDIT_VIEW_CONFIG_NAME
  );
  const showOrganizationWideAuditNote =
    orgWideAuditConfig?.enabled === true &&
    session?.permissions.includes(VIEW_ORGANIZATION_AUDIT_PERMISSION) === true;

  return (
    <AuditTrailsPageContent
      page={page}
      query={query}
      template={template}
      showOrganizationWideAuditNote={showOrganizationWideAuditNote}
    />
  );
}

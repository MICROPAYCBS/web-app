/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { AdhocQueryFormPage } from '@/components/organization/adhoc-query-form-page';
import { getAdhocQueryEditTemplate } from '@/lib/fineract/adhoc-query';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationAdhocQueryEditPage({
  params
}: {
  params: Promise<{ adhocQueryId: string }>;
}) {
  const { adhocQueryId } = await params;
  const session = await getServerSession();

  if (!can(session, 'UPDATE_ADHOC')) {
    notFound();
  }

  let template;
  try {
    template = await getAdhocQueryEditTemplate(adhocQueryId);
  } catch {
    notFound();
  }

  return (
    <AdhocQueryFormPage
      mode="edit"
      adhocQueryId={template.id}
      reportRunFrequencies={template.reportRunFrequencies ?? []}
      initial={{
        name: template.name,
        query: template.query,
        tableName: template.tableName,
        tableFields: template.tableFields,
        email: template.email,
        reportRunFrequency:
          template.reportRunFrequency != null ? String(template.reportRunFrequency) : '',
        reportRunEvery:
          template.reportRunEvery != null ? String(template.reportRunEvery) : '',
        isActive: template.isActive ?? false
      }}
    />
  );
}

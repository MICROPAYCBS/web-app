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
import { getAdhocQueryCreateTemplate } from '@/lib/fineract/adhoc-query';
import { getServerSession } from '@/lib/session/server';

export default async function OrganizationAdhocQueryCreatePage() {
  const session = await getServerSession();
  if (!can(session, 'CREATE_ADHOC')) {
    notFound();
  }

  const template = await getAdhocQueryCreateTemplate();

  return (
    <AdhocQueryFormPage
      mode="create"
      reportRunFrequencies={template.reportRunFrequencies ?? []}
    />
  );
}

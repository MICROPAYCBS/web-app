/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ExternalServiceDetailView } from '@/components/system/external-service-detail-view';
import {
  getExternalServiceDefinition,
  isExternalServiceSlug
} from '@/lib/fineract/external-service-display';
import { getExternalServiceConfiguration } from '@/lib/fineract/external-services';
import { getServerSession } from '@/lib/session/server';

export default async function ExternalServiceDetailPage({
  params
}: {
  params: Promise<{ serviceSlug: string }>;
}) {
  const { serviceSlug } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.externalServices'))) {
    notFound();
  }

  if (!isExternalServiceSlug(serviceSlug)) {
    notFound();
  }

  const definition = getExternalServiceDefinition(serviceSlug);
  const properties = await getExternalServiceConfiguration(definition.apiName);
  const canUpdate = can(session, 'UPDATE_EXTERNALSERVICES');

  return (
    <ExternalServiceDetailView
      definition={definition}
      properties={properties}
      canUpdate={canUpdate}
    />
  );
}

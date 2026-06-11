/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { TemplateDetailView } from '@/components/templates/template-detail-view';
import { getTemplate } from '@/lib/fineract/templates';
import { getServerSession } from '@/lib/session/server';

export default async function TemplateDetailPage({
  params
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.templates'))) {
    notFound();
  }

  const id = Number(templateId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const template = await getTemplate(id);
  if (!template) {
    notFound();
  }

  return (
    <TemplateDetailView
      template={template}
      canUpdate={can(session, 'UPDATE_TEMPLATE')}
      canDelete={can(session, 'DELETE_TEMPLATE')}
    />
  );
}

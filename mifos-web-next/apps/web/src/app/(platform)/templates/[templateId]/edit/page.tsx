/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DetailBackLink } from '@/components/composites';
import { ListPage } from '@/components/composites/list-page';
import { TemplateForm } from '@/components/templates/template-form';
import { templateToFormValues } from '@/lib/fineract/template-display';
import { getTemplateEditFormTemplate } from '@/lib/fineract/templates';
import { getServerSession } from '@/lib/session/server';

export default async function EditTemplatePage({
  params
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.templates')) || !can(session, 'UPDATE_TEMPLATE')) {
    notFound();
  }

  const id = Number(templateId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const formTemplate = await getTemplateEditFormTemplate(id);
  if (!formTemplate?.template) {
    notFound();
  }

  return (
    <ListPage
      backLink={<DetailBackLink href={`/templates/${id}`} label="Back to template" />}
      title={`Edit template: ${formTemplate.template.name}`}
      description="Update template metadata, mappers, and mustache content."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <TemplateForm
          mode="edit"
          templateId={id}
          initialValues={templateToFormValues(formTemplate.template, formTemplate)}
          formTemplate={formTemplate}
        />
      </div>
    </ListPage>
  );
}

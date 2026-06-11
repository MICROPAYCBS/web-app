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
import { defaultTemplateFormValues } from '@/lib/fineract/template-display';
import { getTemplateFormTemplate } from '@/lib/fineract/templates';
import { getServerSession } from '@/lib/session/server';

export default async function CreateTemplatePage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.templates')) || !can(session, 'CREATE_TEMPLATE')) {
    notFound();
  }

  const formTemplate = await getTemplateFormTemplate();

  return (
    <ListPage
      backLink={<DetailBackLink href="/templates" label="Back to templates" />}
      title="Create template"
      description="Define a document or SMS template with mustache placeholders for client or loan data."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <TemplateForm
          mode="create"
          initialValues={defaultTemplateFormValues(formTemplate)}
          formTemplate={formTemplate}
        />
      </div>
    </ListPage>
  );
}

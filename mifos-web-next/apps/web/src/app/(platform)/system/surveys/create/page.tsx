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
import { SurveyForm } from '@/components/system/survey-form';
import { defaultSurveyFormValues } from '@/lib/fineract/survey-display';
import { getServerSession } from '@/lib/session/server';

export default async function CreateSurveyPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.surveys')) || !can(session, 'CREATE_SURVEY')) {
    notFound();
  }

  return (
    <ListPage
      backLink={<DetailBackLink href="/system/surveys" label="Back to surveys" />}
      title="Create survey"
      description="Define survey metadata, questions, and response options."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <SurveyForm mode="create" initialValues={defaultSurveyFormValues()} />
      </div>
    </ListPage>
  );
}

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
import { surveyToFormValues } from '@/lib/fineract/survey-display';
import { getSurvey } from '@/lib/fineract/surveys';
import { getServerSession } from '@/lib/session/server';

export default async function EditSurveyPage({
  params
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.surveys')) || !can(session, 'UPDATE_SURVEY')) {
    notFound();
  }

  const id = Number(surveyId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const survey = await getSurvey(id);
  if (!survey) {
    notFound();
  }

  return (
    <ListPage
      backLink={<DetailBackLink href={`/system/surveys/${survey.id}`} label="Back to survey" />}
      title={`Edit survey: ${survey.name}`}
      description="Update survey metadata, questions, and response options."
    >
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <SurveyForm mode="edit" surveyId={survey.id} initialValues={surveyToFormValues(survey)} />
      </div>
    </ListPage>
  );
}

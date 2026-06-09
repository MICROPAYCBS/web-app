/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SurveyDetailView } from '@/components/system/survey-detail-view';
import { getSurvey } from '@/lib/fineract/surveys';
import { getServerSession } from '@/lib/session/server';

export default async function SurveyDetailPage({
  params
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.surveys'))) {
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

  return <SurveyDetailView survey={survey} canUpdate={can(session, 'UPDATE_SURVEY')} />;
}

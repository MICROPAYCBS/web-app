/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { SurveysPageContent } from '@/components/system/surveys-page-content';
import { listSurveys } from '@/lib/fineract/surveys';
import { getServerSession } from '@/lib/session/server';

export default async function SurveysPage() {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.surveys'))) {
    notFound();
  }

  const surveys = await listSurveys();
  return (
    <SurveysPageContent surveys={surveys} canUpdate={can(session, 'UPDATE_SURVEY')} />
  );
}

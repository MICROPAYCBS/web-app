'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyListItem } from '@mifos/api-client';
import { ListPage } from '@/components/composites/list-page';
import { SurveysTable } from '@/components/system/surveys-table';

export function SurveysPageContent({ surveys }: { surveys: FineractSurveyListItem[] }) {
  return (
    <ListPage
      title="Surveys"
      description="Manage questionnaires used for client and group assessments."
    >
      <SurveysTable surveys={surveys} />
    </ListPage>
  );
}

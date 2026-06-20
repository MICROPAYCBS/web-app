'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractSurveyListItem } from '@mifos/api-client';
import { Can } from '@mifos/auth';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { SurveysTable } from '@/components/system/surveys-table';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SurveysPageContent({
  surveys,
  canUpdate
}: {
  surveys: FineractSurveyListItem[];
  canUpdate: boolean;
}) {
  return (
    <ListPage
      title="Surveys"
      description="Manage questionnaires used for customer and group assessments."
      actions={
        <Can permission="CREATE_SURVEY">
          <Link href="/system/surveys/create" className={cn(buttonVariants())}>
            Create survey
          </Link>
        </Can>
      }
    >
      <SurveysTable surveys={surveys} canUpdate={canUpdate} />
    </ListPage>
  );
}

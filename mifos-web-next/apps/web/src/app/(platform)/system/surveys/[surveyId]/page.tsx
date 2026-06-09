/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ListPage } from '@/components/composites/list-page';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getServerSession } from '@/lib/session/server';

/** Placeholder until survey detail slice (SYS-090) ships. */
export default async function SurveyDetailPlaceholderPage({
  params
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.surveys'))) {
    notFound();
  }

  const { surveyId } = await params;

  return (
    <ListPage
      title="Survey detail"
      description={`Detail view for survey ${surveyId} is in progress.`}
      actions={
        <Link href="/system/surveys" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back to surveys
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">
        Create, edit, activate, and question management will be added in the next surveys wave.
      </p>
    </ListPage>
  );
}

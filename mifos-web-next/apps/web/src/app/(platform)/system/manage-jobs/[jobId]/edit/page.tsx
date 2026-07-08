/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { redirect } from 'next/navigation';

/** Edit opens as a side panel on the job detail view (`?edit=1`). */
export default async function SchedulerJobEditPage({
  params
}: {
  params: Promise<{ jobId: string }>;
}): Promise<never> {
  const { jobId } = await params;
  redirect(`/system/manage-jobs/${jobId}?edit=1`);
}

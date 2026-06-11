/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ReportDetailView } from '@/components/system/report-detail-view';
import { getReport } from '@/lib/fineract/reports';
import { getServerSession } from '@/lib/session/server';

export default async function ReportDetailPage({
  params
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.reports'))) {
    notFound();
  }

  const id = Number(reportId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const report = await getReport(id);
  if (!report) {
    notFound();
  }

  return (
    <ReportDetailView
      report={report}
      canUpdate={can(session, 'UPDATE_REPORT')}
      canDelete={can(session, 'DELETE_REPORT')}
      canRun={can(session, resolvePermission('administration.reports'))}
    />
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ReportRunPageContent } from '@/components/reports/report-run-page-content';
import { getReport } from '@/lib/fineract/reports';
import { getServerSession } from '@/lib/session/server';

export default async function ReportRunPage({
  params
}: {
  params: Promise<{ reportId: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.reports'))) {
    notFound();
  }

  const { reportId } = await params;
  const id = Number(reportId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const report = await getReport(id);
  if (!report || !report.useReport) {
    notFound();
  }

  const canEdit =
    can(session, resolvePermission('system.reports')) && can(session, 'UPDATE_REPORT');

  return <ReportRunPageContent report={report} canEdit={canEdit} />;
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ReportForm } from '@/components/system/report-form';
import { getReport, getReportTemplate } from '@/lib/fineract/reports';
import { getServerSession } from '@/lib/session/server';

export default async function EditReportPage({
  params
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const session = await getServerSession();
  if (!can(session, resolvePermission('system.reports')) || !can(session, 'UPDATE_REPORT')) {
    notFound();
  }

  const id = Number(reportId);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const [report, template] = await Promise.all([getReport(id), getReportTemplate()]);
  if (!report) {
    notFound();
  }

  return <ReportForm mode="edit" reportId={id} report={report} template={template} />;
}

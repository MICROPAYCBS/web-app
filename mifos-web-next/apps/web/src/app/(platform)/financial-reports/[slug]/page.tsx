/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { ReportRunPageContent } from '@/components/reports/report-run-page-content';
import {
  getFinancialReportBySlug,
  isFinancialReportSlug
} from '@/lib/fineract/financial-reports';
import { findRunnableReportByName } from '@/lib/fineract/reports';
import { getServerSession } from '@/lib/session/server';

export default async function FinancialReportRunPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession();
  if (!can(session, resolvePermission('administration.reports'))) {
    notFound();
  }

  const { slug } = await params;
  if (!isFinancialReportSlug(slug)) {
    notFound();
  }

  const definition = getFinancialReportBySlug(slug);
  if (!definition) {
    notFound();
  }

  const report = await findRunnableReportByName(definition.reportName);
  if (!report) {
    notFound();
  }

  const canEdit =
    can(session, resolvePermission('system.reports')) && can(session, 'UPDATE_REPORT');

  return (
    <ReportRunPageContent
      report={report}
      canEdit={canEdit}
      backHref="/reports"
      backLabel="Back to all reports"
    />
  );
}

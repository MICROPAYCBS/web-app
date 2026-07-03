/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { notFound } from 'next/navigation';
import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';
import {
  buildDashboardActivities,
  buildDashboardShortcuts
} from '@/lib/dashboard/dashboard-activities';
import { fetchDashboardAnalytics } from '@/lib/fineract/dashboard-analytics';
import { fetchDashboardCounts } from '@/lib/fineract/dashboard-counts';
import { listOffices } from '@/lib/fineract/offices';
import { getServerSession } from '@/lib/session/server';

function resolveDefaultOfficeId(
  sessionOfficeId: number,
  offices: { id: number }[]
): number | null {
  if (offices.some((office) => office.id === sessionOfficeId)) {
    return sessionOfficeId;
  }
  return offices[0]?.id ?? null;
}

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) {
    notFound();
  }

  const includeClients = can(session, resolvePermission('clients.list'));
  const includeLoans = can(session, resolvePermission('loans.list'));
  const includeSavings = can(session, resolvePermission('savings.list'));
  const includeReports = can(session, resolvePermission('system.reports'));

  const offices = includeReports ? await listOffices() : [];
  const defaultOfficeId = resolveDefaultOfficeId(session.officeId, offices);

  const [counts, initialAnalytics] = await Promise.all([
    fetchDashboardCounts({ includeClients, includeLoans, includeSavings }),
    includeReports && defaultOfficeId != null
      ? fetchDashboardAnalytics(defaultOfficeId, 'Month')
      : Promise.resolve(null)
  ]);

  return (
    <DashboardPageContent
      activities={buildDashboardActivities()}
      shortcuts={buildDashboardShortcuts()}
      counts={counts}
      offices={offices.map((office) => ({ id: office.id, name: office.name }))}
      defaultOfficeId={defaultOfficeId}
      initialAnalytics={initialAnalytics}
      showAnalytics={includeReports && defaultOfficeId != null && initialAnalytics != null}
    />
  );
}

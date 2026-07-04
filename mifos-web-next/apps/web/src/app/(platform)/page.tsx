/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';
import {
  buildDashboardActivities,
  buildDashboardShortcuts
} from '@/lib/dashboard/dashboard-activities';
import { fetchDashboardAnalytics } from '@/lib/fineract/dashboard-analytics';
import { fetchDashboardKpis } from '@/lib/fineract/dashboard-kpis';
import { getBusinessDateContext } from '@/lib/fineract/business-date';
import { resolveTransactionDate } from '@/lib/fineract/business-date-context';
import { canOpenCashierDetail } from '@/lib/fineract/cashier-access';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { listOffices } from '@/lib/fineract/offices';
import {
  getDefaultOrganizationCurrencyCode,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
import { mapOrganizationCurrencies } from '@/lib/dashboard/dashboard-currency';
import type { DashboardCurrencyOption } from '@/lib/dashboard/analytics-types';
import type { DashboardKpis } from '@/lib/dashboard/dashboard-kpi-types';
import { dateToFineract } from '@/lib/fineract/date-input';
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

function emptyDashboardKpis(
  officeId: number | null,
  currencyCode: string | null,
  businessDate: string
): DashboardKpis {
  return {
    officeId,
    currencyCode,
    businessDate,
    customers: { total: null, active: null },
    loans: {
      active: null,
      pendingApproval: null,
      pendingDisbursal: null,
      inArrears: null,
      portfolioAtRiskPercent: null,
      disbursedTodayAmount: null,
      disbursedMonthAmount: null
    },
    collections: { expectedAmount: null, expectedLoanCount: null },
    savings: { total: null },
    checkerInboxPending: null,
    cashier: null
  };
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
  const includeCollections = can(session, resolvePermission('collections'));
  const includeCheckerInbox = can(session, resolvePermission('checkerInbox'));
  const includeCashier = canOpenCashierDetail(session);

  const showKpis =
    includeClients ||
    includeLoans ||
    includeSavings ||
    includeCheckerInbox ||
    includeCollections ||
    includeCashier;

  const businessDateContext = await getBusinessDateContext().catch(() => null);
  const today = dateToFineract(new Date()) ?? format(new Date(), FINERACT_DATE_FORMAT);
  const businessDate = resolveTransactionDate(
    businessDateContext ?? { enabled: false },
    today
  );

  const offices =
    showKpis || includeReports ? await listOffices().catch(() => []) : [];
  const defaultOfficeId =
    offices.length > 0 ? resolveDefaultOfficeId(session.officeId, offices) : null;

  const selectedCurrencies: DashboardCurrencyOption[] =
    showKpis || includeReports
      ? mapOrganizationCurrencies(await getOrganizationSelectedCurrencies().catch(() => []))
      : [];
  const defaultCurrencyCode =
    selectedCurrencies[0]?.code ??
    (await getDefaultOrganizationCurrencyCode().catch(() => undefined)) ??
    null;

  const kpiOptions = {
    officeId: defaultOfficeId,
    currencyCode: defaultCurrencyCode,
    businessDate,
    includeClients,
    includeLoans,
    includeSavings,
    includeReports,
    includeCollections,
    includeCheckerInbox,
    includeCashier,
    userId: session.userId,
    userOfficeId: session.officeId
  };

  const [initialKpis, initialAnalytics] = await Promise.all([
    showKpis
      ? fetchDashboardKpis(kpiOptions, session)
      : Promise.resolve(emptyDashboardKpis(defaultOfficeId, defaultCurrencyCode, businessDate)),
    includeReports && defaultOfficeId != null
      ? fetchDashboardAnalytics(defaultOfficeId, 'Month', defaultCurrencyCode)
      : Promise.resolve(null)
  ]);

  return (
    <DashboardPageContent
      activities={buildDashboardActivities()}
      shortcuts={buildDashboardShortcuts()}
      offices={offices.map((office) => ({ id: office.id, name: office.name }))}
      currencies={selectedCurrencies}
      defaultOfficeId={defaultOfficeId}
      defaultCurrencyCode={defaultCurrencyCode}
      initialKpis={initialKpis}
      initialAnalytics={initialAnalytics}
      showKpis={showKpis}
      showAnalytics={includeReports && defaultOfficeId != null && initialAnalytics != null}
      permissions={{
        clients: includeClients,
        loans: includeLoans,
        savings: includeSavings,
        reports: includeReports,
        checker: includeCheckerInbox,
        collections: includeCollections,
        cashier: includeCashier
      }}
    />
  );
}

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
import { mapOrganizationCurrencies } from '@/lib/dashboard/dashboard-currency';
import type { DashboardCurrencyOption } from '@/lib/dashboard/analytics-types';
import type { DashboardKpis } from '@/lib/dashboard/dashboard-kpi-types';
import { canOpenCashierDetail } from '@/lib/fineract/cashier-access';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { dateToFineract } from '@/lib/fineract/date-input';
import {
  getDefaultOrganizationCurrencyCode,
  getOrganizationSelectedCurrencies
} from '@/lib/fineract/organization-currencies';
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

  const businessDate = dateToFineract(new Date()) ?? format(new Date(), FINERACT_DATE_FORMAT);

  const offices = showKpis ? await listOffices().catch(() => []) : [];
  const defaultOfficeId =
    offices.length > 0 ? resolveDefaultOfficeId(session.officeId, offices) : null;

  const selectedCurrencies: DashboardCurrencyOption[] = showKpis
    ? mapOrganizationCurrencies(await getOrganizationSelectedCurrencies().catch(() => []))
    : [];
  const defaultCurrencyCode =
    selectedCurrencies[0]?.code ??
    (await getDefaultOrganizationCurrencyCode().catch(() => undefined)) ??
    null;

  const initialKpis = emptyDashboardKpis(defaultOfficeId, defaultCurrencyCode, businessDate);

  return (
    <DashboardPageContent
      offices={offices.map((office) => ({
        id: office.id,
        name: office.name,
        nameDecorated: office.nameDecorated
      }))}
      currencies={selectedCurrencies}
      defaultOfficeId={defaultOfficeId}
      defaultCurrencyCode={defaultCurrencyCode}
      initialKpis={initialKpis}
      showKpis={showKpis}
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

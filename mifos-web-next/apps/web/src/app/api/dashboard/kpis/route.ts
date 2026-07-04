/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { can, resolvePermission } from '@mifos/auth';
import { format } from 'date-fns';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import {
  mapOrganizationCurrencies,
  parseDashboardCurrencyCode
} from '@/lib/dashboard/dashboard-currency';
import { getBusinessDateContext } from '@/lib/fineract/business-date';
import { resolveTransactionDate } from '@/lib/fineract/business-date-context';
import { canOpenCashierDetail } from '@/lib/fineract/cashier-access';
import { FINERACT_DATE_FORMAT } from '@/lib/fineract/dates';
import { dateToFineract } from '@/lib/fineract/date-input';
import { fetchDashboardKpis } from '@/lib/fineract/dashboard-kpis';
import { getOrganizationSelectedCurrencies } from '@/lib/fineract/organization-currencies';

export async function GET(request: Request) {
  const { session, error } = await requireRoutePermission('/');
  if (error || !session) {
    return error ?? jsonError(new Error('Unauthorized'));
  }

  try {
    const { searchParams } = new URL(request.url);
    const officeIdRaw = searchParams.get('officeId');
    const officeId =
      officeIdRaw != null && officeIdRaw.trim() !== '' ? Number(officeIdRaw) : null;

    if (
      officeIdRaw != null &&
      officeIdRaw.trim() !== '' &&
      (officeId == null || !Number.isFinite(officeId) || officeId <= 0)
    ) {
      return jsonError(new Error('officeId must be a positive number'));
    }

    const businessDateContext = await getBusinessDateContext().catch(() => null);
    const today = dateToFineract(new Date()) ?? format(new Date(), FINERACT_DATE_FORMAT);
    const businessDate = resolveTransactionDate(
      businessDateContext ?? { enabled: false },
      today
    );

    const currencies = mapOrganizationCurrencies(
      await getOrganizationSelectedCurrencies().catch(() => [])
    );
    const currencyCode = parseDashboardCurrencyCode(
      searchParams.get('currencyCode'),
      currencies
    );

    const data = await fetchDashboardKpis(
      {
        officeId,
        currencyCode,
        businessDate,
        includeClients: can(session, resolvePermission('clients.list')),
        includeLoans: can(session, resolvePermission('loans.list')),
        includeSavings: can(session, resolvePermission('savings.list')),
        includeReports: can(session, resolvePermission('system.reports')),
        includeCollections: can(session, resolvePermission('collections')),
        includeCheckerInbox: can(session, resolvePermission('checkerInbox')),
        includeCashier: canOpenCashierDetail(session),
        userId: session.userId,
        userOfficeId: session.officeId
      },
      session
    );

    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}

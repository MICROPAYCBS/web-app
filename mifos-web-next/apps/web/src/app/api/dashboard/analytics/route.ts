/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import type { DashboardTimescale } from '@/lib/dashboard/analytics-types';
import { fetchDashboardAnalytics } from '@/lib/fineract/dashboard-analytics';

function parseTimescale(value: string | null): DashboardTimescale {
  if (value === 'Day' || value === 'Week' || value === 'Month') {
    return value;
  }
  return 'Month';
}

export async function GET(request: Request) {
  const { session, error } = await requireRoutePermission('/');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('system.reports'));
    const { searchParams } = new URL(request.url);
    const officeId = Number(searchParams.get('officeId'));
    if (!Number.isFinite(officeId) || officeId <= 0) {
      return jsonError(new Error('officeId is required'));
    }
    const timescale = parseTimescale(searchParams.get('timescale'));
    const data = await fetchDashboardAnalytics(officeId, timescale);
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}

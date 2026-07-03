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
import { fetchLoansList } from '@/lib/fineract/loans-list';
import { parsePortfolioListQuery } from '@/lib/fineract/portfolio-list-query';

export async function GET(request: Request) {
  const { session, error } = await requireRoutePermission('/loans');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('loans.list'));
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const query = parsePortfolioListQuery(params);
    const data = await fetchLoansList(query);
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}

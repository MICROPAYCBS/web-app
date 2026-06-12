/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { validateCreateCenter } from '@mifos/validation';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { createCenter, defaultCenterMutationMeta } from '@/lib/fineract/centers';
import { fetchCentersList } from '@/lib/fineract/centers-list';
import { parseCentersListQuery } from '@/lib/fineract/centers-list-query';

export async function GET(request: Request) {
  const { session, error } = await requireRoutePermission('/centers');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('clients.list'));
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const query = parseCentersListQuery(params);
    const data = await fetchCentersList(query);
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireRoutePermission('/centers');
  if (error) {
    return error;
  }

  try {
    assertCan(session, 'CREATE_CENTER');
    const body = await request.json();
    const parsed = validateCreateCenter({
      ...defaultCenterMutationMeta(),
      ...body
    });
    if (!parsed.success) {
      return jsonError(new Error('Validation failed'));
    }
    const data = await createCenter(parsed.data);
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}

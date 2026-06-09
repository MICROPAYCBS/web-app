/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import { searchEntities } from '@/lib/fineract/search';
import { SEARCH_RESOURCE_ALL } from '@/lib/search/entity-search';

/**
 * BFF: global entity search — browser calls /api/search, server calls Fineract GET /search.
 */
export async function GET(request: Request) {
  const { error } = await requireServerSession();
  if (error) {
    return error;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() ?? '';
  if (!query || query.length < 2) {
    return jsonOk([]);
  }

  const resource = searchParams.get('resource') ?? SEARCH_RESOURCE_ALL;
  const exactMatch = searchParams.get('exactMatch') === 'true';

  try {
    const results = await searchEntities({ query, resource, exactMatch });
    return jsonOk(results);
  } catch (err) {
    return jsonError(err);
  }
}

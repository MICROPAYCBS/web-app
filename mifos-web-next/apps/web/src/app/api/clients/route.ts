/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { createClientSchema } from '@mifos/validation';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireRoutePermission } from '@/lib/bff/require-session';
import { createClient, listClients } from '@/lib/fineract/clients';

/**
 * BFF: list / create clients — browser calls /api/clients, server calls Fineract.
 */
export async function GET(request: Request) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('clients.list'));
    const { searchParams } = new URL(request.url);
    const offset = Number(searchParams.get('offset') ?? '0');
    const limit = Number(searchParams.get('limit') ?? '25');
    const orderBy = searchParams.get('orderBy') ?? undefined;
    const sortOrder = (searchParams.get('sortOrder') as 'ASC' | 'DESC' | null) ?? undefined;
    const data = await listClients({ offset, limit, orderBy, sortOrder });
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireRoutePermission('/clients');
  if (error) {
    return error;
  }

  try {
    assertCan(session, resolvePermission('clients.create'));
    const body = await request.json();
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(new Error('Validation failed'));
    }
    const data = await createClient(parsed.data);
    return jsonOk(data, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

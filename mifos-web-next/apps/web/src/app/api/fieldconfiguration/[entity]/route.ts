/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { assertCan, resolvePermission } from '@mifos/auth';
import { jsonError, jsonOk } from '@/lib/bff/json-response';
import { requireServerSession } from '@/lib/bff/require-session';
import {
  getFieldConfiguration,
  isFieldConfigurationEntitySlug,
  resolveFieldConfigurationEntity
} from '@/lib/fineract/field-configuration';

type RouteContext = {
  params: Promise<{ entity: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { session, error } = await requireServerSession();
  if (error) {
    return error;
  }

  const { entity: entitySlug } = await context.params;
  if (!isFieldConfigurationEntitySlug(entitySlug)) {
    return Response.json({ message: 'Unknown field configuration entity' }, { status: 404 });
  }

  try {
    assertCan(session, resolvePermission('organization.addressFieldConfiguration'));
    const entity = resolveFieldConfigurationEntity(entitySlug);
    if (!entity) {
      return Response.json({ message: 'Unknown field configuration entity' }, { status: 404 });
    }
    const data = await getFieldConfiguration(entity);
    return jsonOk(data);
  } catch (err) {
    return jsonError(err);
  }
}

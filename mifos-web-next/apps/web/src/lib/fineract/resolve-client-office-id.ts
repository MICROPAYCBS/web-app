import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractClientDetail } from '@mifos/api-client';
import { getClientForEdit } from '@/lib/fineract/client-edit';

function readOfficeId(source?: {
  officeId?: number;
  office?: { id?: number };
}): number | undefined {
  if (!source) {
    return undefined;
  }
  if (typeof source.officeId === 'number' && source.officeId > 0) {
    return source.officeId;
  }
  const nested = source.office?.id;
  if (typeof nested === 'number' && nested > 0) {
    return nested;
  }
  return undefined;
}

/** Standing instruction template requires a valid `fromOfficeId`. */
export async function resolveClientOfficeId(
  clientId: string | number,
  client?: FineractClientDetail
): Promise<number> {
  const fromDetail = readOfficeId(client);
  if (fromDetail) {
    return fromDetail;
  }

  const edit = await getClientForEdit(clientId);
  const fromEdit = readOfficeId(edit);
  if (fromEdit) {
    return fromEdit;
  }

  throw new Error('Could not determine the client office for standing instructions.');
}

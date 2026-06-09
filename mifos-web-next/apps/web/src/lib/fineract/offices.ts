/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractOfficeOption } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';

export async function listOfficeOptions(): Promise<FineractOfficeOption[]> {
  const fineract = await createFineractClient();
  const data = await fineract.get<
    FineractOfficeOption[] | { pageItems?: FineractOfficeOption[] }
  >('/offices');
  const list = Array.isArray(data) ? data : (data.pageItems ?? []);
  return list.filter(
    (office) =>
      typeof office.id === 'number' &&
      (office.name?.trim() || office.nameDecorated?.trim())
  );
}

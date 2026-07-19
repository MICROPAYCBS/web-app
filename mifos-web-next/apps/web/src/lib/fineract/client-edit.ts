/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import 'server-only';

import type { FineractClientEditData } from '@mifos/api-client';
import { createFineractClient } from '@/lib/fineract/create-client';
import { listCustomerClasses } from '@/lib/fineract/customer-classes';

export async function getClientForEdit(clientId: string | number): Promise<FineractClientEditData> {
  const fineract = await createFineractClient();
  const data = await fineract.get<FineractClientEditData>(`/clients/${clientId}`, {
    template: 'true',
    staffInSelectedOfficeOnly: 'true'
  });

  if (!data.customerClassOptions?.length) {
    data.customerClassOptions = (await listCustomerClasses()).filter(
      (customerClass) => !customerClass.status || customerClass.status === 'ACTIVE'
    );
  }

  return data;
}

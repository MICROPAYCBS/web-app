import type { FineractCommandProcessingResult } from '@mifos/api-client';
import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { createFineractClient } from '@/lib/fineract/create-client';

export async function executeClientCommand(
  clientId: string,
  command: string,
  body: Record<string, unknown> = {}
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(`/clients/${clientId}`, body, { command });
}

export async function deleteClientById(clientId: string): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.delete<FineractCommandProcessingResult>(`/clients/${clientId}`);
}

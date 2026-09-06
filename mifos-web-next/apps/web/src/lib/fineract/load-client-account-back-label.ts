import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getClient } from '@/lib/fineract/clients';
import { clientAccountBackLabel, clientDisplayName } from '@/lib/fineract/clients-display';

/** Resolve “Back to {name}” for account load-error pages when the account payload is unavailable. */
export async function loadClientAccountBackLabel(clientId: string | number): Promise<string> {
  try {
    const client = await getClient(clientId);
    return clientAccountBackLabel(clientDisplayName(client));
  } catch {
    return clientAccountBackLabel();
  }
}

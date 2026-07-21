import 'server-only';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractCommandProcessingResult } from '@mifos/api-client';
import { SHARE_ACCOUNTS_API_PATH } from '@/lib/fineract/share-account-config';
import { createFineractClient } from '@/lib/fineract/create-client';

export type ShareAccountLifecycleCommand =
  | 'approve'
  | 'undoapproval'
  | 'activate'
  | 'reject'
  | 'close';

export type ShareAccountSharesCommand =
  | 'applyadditionalshares'
  | 'approveadditionalshares'
  | 'rejectadditionalshares'
  | 'redeemshares';

export type ShareAccountCommand = ShareAccountLifecycleCommand | ShareAccountSharesCommand;

export async function executeShareAccountCommand(
  accountId: string | number,
  command: ShareAccountCommand,
  body: Record<string, unknown>
): Promise<FineractCommandProcessingResult> {
  const fineract = await createFineractClient();
  return fineract.post<FineractCommandProcessingResult>(
    `${SHARE_ACCOUNTS_API_PATH}/${accountId}`,
    body,
    { command }
  );
}

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { notFound } from 'next/navigation';
import { CLIENT_ACCOUNT_RESERVED_IDS } from '@/lib/fineract/client-action-paths';
import {
  isClientAccountSegment,
  productKindFromAccountSegment
} from '@/lib/fineract/client-account-links';

/**
 * Catch-all for account kinds without a sibling detail tree.
 * Savings, loans, FD, RD, and shares have dedicated routes.
 */
export default async function ClientAccountGeneralPage({
  params
}: {
  params: Promise<{ clientId: string; accountSegment: string; accountId: string }>;
}): Promise<never> {
  const { accountSegment, accountId } = await params;

  if (!isClientAccountSegment(accountSegment) || CLIENT_ACCOUNT_RESERVED_IDS.has(accountId)) {
    notFound();
  }

  const kind = productKindFromAccountSegment(accountSegment);
  if (
    kind === 'savings' ||
    kind === 'loan' ||
    kind === 'fixedDeposit' ||
    kind === 'recurringDeposit' ||
    kind === 'share'
  ) {
    notFound();
  }

  notFound();
}

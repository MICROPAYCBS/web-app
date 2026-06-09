/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import type { ClientStatusKind } from '@/lib/fineract/client-status';

export function ClientTransferBanner({
  clientId,
  clientStatus
}: {
  clientId: string | number;
  clientStatus: ClientStatusKind;
}) {
  const label =
    clientStatus === 'transferOnHold' ? 'Transfer on hold' : 'Transfer in progress';

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-muted-foreground">
        {clientStatus === 'transferOnHold'
          ? 'Release savings holds and clear blockers on the transfer panel to complete the move.'
          : 'Destination branch can accept or reject this transfer; source branch can undo the proposal.'}
      </p>
      <Link
        href={`/clients/${clientId}/general#transfer-status`}
        className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline"
      >
        View transfer details
      </Link>
    </div>
  );
}

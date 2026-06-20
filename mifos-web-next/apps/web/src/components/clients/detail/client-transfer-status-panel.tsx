/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Link from 'next/link';
import { ClientOnHoldReleaseTable } from '@/components/clients/detail/client-on-hold-release-table';
import { DetailSection } from '@/components/composites';
import type { ClientTransferContext } from '@/lib/fineract/client-transfer';

function transferStatusTitle(clientStatus: ClientTransferContext['clientStatus']): string {
  return clientStatus === 'transferOnHold' ? 'Transfer on hold' : 'Transfer in progress';
}

function transferStatusDescription(clientStatus: ClientTransferContext['clientStatus']): string {
  if (clientStatus === 'transferOnHold') {
    return 'The transfer is accepted but waiting for blockers to clear (for example held savings balances or a future transfer date). Release holds below; the move to the destination branch completes automatically when ready.';
  }
  return 'This customer is proposed for transfer. The destination branch can accept or reject; the source branch can undo the proposal before it is accepted.';
}

export function ClientTransferStatusPanel({
  clientId,
  context
}: {
  clientId: string;
  context: ClientTransferContext;
}) {
  return (
    <div id="transfer-status" className="lg:col-span-2">
    <DetailSection
      title={transferStatusTitle(context.clientStatus)}
      description={transferStatusDescription(context.clientStatus)}
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Current branch</dt>
          <dd className="font-medium">{context.currentOfficeName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Destination branch</dt>
          <dd className="font-medium">{context.destinationOfficeName ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Transfer date</dt>
          <dd className="font-medium">{context.transferDateLabel ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Customer status</dt>
          <dd className="font-medium capitalize">
            {context.clientStatus === 'transferOnHold' ? 'On hold' : 'In progress'}
          </dd>
        </div>
      </dl>

      {context.accounts.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Accounts in transfer</h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {context.accounts.map((account) => (
              <li
                key={`${account.productKind}-${account.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">{account.accountNo}</p>
                  <p className="text-muted-foreground">
                    {account.productName ?? account.productKind}
                    {account.statusLabel ? ` · ${account.statusLabel}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {account.transferState === 'on_hold' ? 'On hold' : 'In progress'}
                  </span>
                  <Link
                    href={account.href}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View account
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {context.clientStatus === 'transferOnHold' ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Savings amounts on hold</h3>
          {context.onHoldTransactions.length > 0 ? (
            <ClientOnHoldReleaseTable clientId={clientId} rows={context.onHoldTransactions} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No on-hold savings transactions were returned. If the transfer date is in the
              future, wait until that date; otherwise check each savings account for blocking
              holds on the server.
            </p>
          )}
        </div>
      ) : null}
    </DetailSection>
    </div>
  );
}

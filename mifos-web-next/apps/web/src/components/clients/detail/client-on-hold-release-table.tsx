'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toastCommandOutcome, toastActionError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { releaseSavingsOnHoldAction } from '@/actions/client-transfer-hold';
import type { ClientTransferOnHoldRow } from '@/lib/fineract/client-transfer';
import { Button } from '@/components/ui/button';

export function ClientOnHoldReleaseTable({
  clientId,
  rows
}: {
  clientId: string;
  rows: ClientTransferOnHoldRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRelease(row: ClientTransferOnHoldRow) {
    startTransition(async () => {
      const result = await releaseSavingsOnHoldAction(
        clientId,
        String(row.savingsId),
        String(row.transactionId)
      );
      if (!result.ok) {

        toastActionError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Held amount released.', pending: 'Held amount released sent for approval.' });
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">Savings account</th>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium text-right">Amount</th>
            <th className="px-3 py-2 font-medium">Reason</th>
            <th className="px-3 py-2 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.savingsId}-${row.transactionId}`} className="border-b border-border last:border-0">
              <td className="px-3 py-2 tabular-nums">{row.savingsAccountNo}</td>
              <td className="px-3 py-2">{row.dateLabel}</td>
              <td className="px-3 py-2 text-right tabular-nums">{row.amountLabel}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.reason ?? '—'}</td>
              <td className="px-3 py-2 text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleRelease(row)}
                >
                  Release
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

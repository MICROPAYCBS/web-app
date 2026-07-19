'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractLockedLoan } from '@mifos/api-client';
import { Play, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toastCommandOutcome, toastFineractError } from '@/lib/command-outcome-toast';
import { toast } from 'sonner';
import { runInlineCobAction, startCobCatchUpAction } from '@/actions/jobs';
import { LockedLoansTable } from '@/components/system/manage-jobs/locked-loans-table';
import { Button } from '@/components/ui/button';

export function CobJobsPanel({
  isCatchUpRunning,
  loans,
  canUpdate,
  canExecuteInline
}: {
  isCatchUpRunning: boolean;
  loans: FineractLockedLoan[];
  canUpdate: boolean;
  canExecuteInline: boolean;
}) {
  const router = useRouter();
  const [selectedLoans, setSelectedLoans] = useState<FineractLockedLoan[]>([]);
  const [pending, startTransition] = useTransition();

  function handleCatchUp() {
    startTransition(async () => {
      const result = await startCobCatchUpAction();
      if (!result.ok) {

        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Catch-up started.', pending: 'Catch-up started sent for approval.' });
      router.refresh();
    });
  }

  function handleInlineCob() {
    startTransition(async () => {
      const result = await runInlineCobAction(selectedLoans.map((loan) => loan.loanId));
      if (!result.ok) {

        toastFineractError(result.message);
        return;
      }
      toastCommandOutcome(result, { completed: 'Inline COB started for selected loans.', pending: 'Inline COB started for selected loans sent for approval.' });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Monitor close-of-business catch-up, review loans locked during processing, and run inline
        COB for selected accounts.
      </p>
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Catch-up status</p>
          <p className="text-sm text-muted-foreground">
            {isCatchUpRunning ? 'Catch-up is currently running.' : 'Catch-up is not running.'}
          </p>
        </div>
        <div className="flex gap-2">
          {canUpdate && !isCatchUpRunning ? (
            <Button type="button" onClick={handleCatchUp} disabled={pending}>
              <Play className="mr-2 size-4" />
              Run catch-up
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => router.refresh()} disabled={pending}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {canExecuteInline ? (
        <Button
          type="button"
          disabled={!selectedLoans.length || pending}
          onClick={handleInlineCob}
        >
          Start inline COB
        </Button>
      ) : null}

      <LockedLoansTable
        loans={loans}
        canExecuteInline={canExecuteInline}
        onSelectedLoansChange={setSelectedLoans}
      />
    </div>
  );
}
